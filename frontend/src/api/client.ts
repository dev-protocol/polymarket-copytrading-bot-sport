import type { BotState } from "../types/state";

const API = "/api/state";

export async function fetchState(): Promise<BotState> {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch state");
  return res.json();
}
