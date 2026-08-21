import { db } from "@/db/schema";

const TERMINAL_KEY = "terminal";

function randomPrefix(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

export async function getOrCreateTerminal() {
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
