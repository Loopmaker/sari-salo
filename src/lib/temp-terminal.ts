// TEMPORARY — Phase 3 only. Replaced entirely by Dexie-backed terminal
// metadata in Phase 4. This is intentionally not persisted beyond the
// browser session; do not build on top of this.

export function getTempTerminalId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("temp_terminal_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("temp_terminal_id", id);
  }
  return id;
}

export function getNextTempOrderNumber(): string {
  if (typeof window === "undefined") return "TEMP-0";
  const current = parseInt(sessionStorage.getItem("temp_order_seq") ?? "0", 10);
  const next = current + 1;
  sessionStorage.setItem("temp_order_seq", String(next));
  return `TEMP-${next}`;
}
