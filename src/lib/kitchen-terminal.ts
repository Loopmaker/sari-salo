const KITCHEN_TERMINAL_KEY = "kitchen_terminal_id";

export function getKitchenTerminalId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KITCHEN_TERMINAL_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KITCHEN_TERMINAL_KEY, id);
  }
  return id;
}
