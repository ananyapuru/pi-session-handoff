import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const HANDOFF_DIR = join(process.env.HOME ?? ".", ".pi", "agent", "session-handoffs");

const HANDOFF_PROMPT = (sessionFile?: string) => `Review this completed Pi session for durable, high-value, non-brittle project knowledge.${sessionFile ? ` The previous session is recorded at \`${sessionFile}\`; read it if needed.` : ""}

First, ask for approval. Then present documentation candidates as a table sorted by value descending and brittleness ascending. For every candidate include: learning, why it matters, target documentation file, and verified source path/line where relevant. Only propose cross-file behavior, operational invariants, workflows, failure modes, ownership boundaries, or surprising constraints that are non-obvious, stable for months, and likely save 30+ minutes. Do not propose temporary state, obvious facts, or local implementation details.

After explicit approval, make documentation changes, add a concise provenance comment to a relevant source file only where it captures a durable surprising constraint, create a branch, and open a PR. Put thumbs-up/thumbs-down review instructions in that PR. Also include a learning prompt that uses feedback to improve both future suggestions and this handoff process.`;

type PendingHandoff = {
  cwd: string;
  sessionFile?: string;
  createdAt: string;
};

async function savePending(ctx: ExtensionContext) {
  await mkdir(HANDOFF_DIR, { recursive: true });
  const pending: PendingHandoff = {
    cwd: ctx.cwd,
    sessionFile: ctx.sessionManager.getSessionFile(),
    createdAt: new Date().toISOString(),
  };
  await writeFile(join(HANDOFF_DIR, `${Date.now()}.json`), JSON.stringify(pending, null, 2));
}

async function pendingForCwd(cwd: string) {
  try {
    const files = await readdir(HANDOFF_DIR);
    const records = await Promise.all(
      files.filter((file) => file.endsWith(".json")).map(async (file) => {
        const path = join(HANDOFF_DIR, file);
        return { path, data: JSON.parse(await readFile(path, "utf8")) as PendingHandoff };
      }),
    );
    return records.filter((record) => record.data.cwd === cwd);
  } catch {
    return [];
  }
}

export default function (pi: ExtensionAPI) {
  let offered = false;

  async function askAndQueue(ctx: ExtensionContext) {
    if (offered || !ctx.hasUI) return false;
    offered = true;
    const approved = await ctx.ui.confirm(
      "Session handoff",
      "Search this session for durable project learnings and prepare a documentation PR?",
    );
    if (!approved) return false;
    pi.sendUserMessage(HANDOFF_PROMPT(ctx.sessionManager.getSessionFile() ?? undefined), {
      deliverAs: "followUp",
    });
    return true;
  }

  pi.registerCommand("session-handoff", {
    description: "Review current session for durable documentation candidates",
    handler: async (_args, ctx) => {
      if (await ctx.ui.confirm("Session handoff", "Review this session and prepare a documentation PR?")) {
        pi.sendUserMessage(HANDOFF_PROMPT(ctx.sessionManager.getSessionFile() ?? undefined), {
          deliverAs: "followUp",
        });
      }
    },
  });

  // A switch can be cancelled, so the agent has time to review and act before replacement.
  pi.on("session_before_switch", async (_event, ctx) => {
    if (await askAndQueue(ctx)) return { cancel: true };
  });
  pi.on("session_before_fork", async (_event, ctx) => {
    if (await askAndQueue(ctx)) return { cancel: true };
  });

  // Shutdown cannot be cancelled and terminal UI may already be gone. Persist the
  // handoff without a modal; the next session asks before any agent work starts.
  pi.on("session_shutdown", async (_event, ctx) => {
    if (offered) return;
    offered = true;
    await savePending(ctx);
  });

  pi.on("session_start", async (_event, ctx) => {
    const pending = await pendingForCwd(ctx.cwd);
    if (pending.length === 0 || !ctx.hasUI) return;
    const newest = pending.at(-1)!;
    if (await ctx.ui.confirm("Pending session handoff", "Review saved learnings from previous session?")) {
      await rename(newest.path, `${newest.path}.claimed`);
      pi.sendUserMessage(HANDOFF_PROMPT(newest.data.sessionFile), { deliverAs: "followUp" });
    }
  });
}
