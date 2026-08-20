import { db } from "@/db/schema";

const TERMINAL_KEY = "terminal";

function randomPrefix(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

export async function getOrCreateTerminal() {
  // Race-safe by relying on meta.key being the primary key: attempt
  // an add() directly rather than get-then-add. IndexedDB enforces
  // key uniqueness at the transaction level, so if two callers race,
  // exactly one add() succeeds and the other throws a constraint
  // error — at which point we just re-read whatever won.
  const fresh = {
    key: TERMINAL_KEY,
    terminalId: crypto.randomUUID(),
    terminalPrefix: randomPrefix(),
    lastOrderSequence: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    await db.meta.add(fresh);
    return fresh;
  } catch (err) {
    // ConstraintError means a terminal already exists (either from a
    // previous session, or a concurrent caller won the race). Either
    // way, the correct move is the same: read and return it.
    if (err instanceof Error && err.name === "ConstraintError") {
      const existing = await db.meta.get(TERMINAL_KEY);
      if (existing) return existing;
    }
    throw err;
  }
}

export async function allocateNextOrderNumber(): Promise<{
  orderNumber: string;
  terminalId: string;
}> {
  const terminal = await db.meta.get(TERMINAL_KEY);
  if (!terminal) {
    throw new Error(
      "Terminal not initialized — call getOrCreateTerminal() on boot first.",
    );
  }

  const next = terminal.lastOrderSequence + 1;
  await db.meta.update(TERMINAL_KEY, { lastOrderSequence: next });

  return {
    orderNumber: `${terminal.terminalPrefix}-${next}`,
    terminalId: terminal.terminalId,
  };
}
