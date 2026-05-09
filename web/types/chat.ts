export type ChatRole = "user" | "assistant";

export type ToolCall = {
  id: string;
  name: string;
  status: "running" | "ok" | "error";
};

export type ChartPayload = {
  type: "bar" | "line";
  title: string;
  labels: string[];
  values: number[];
  unit?: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  toolCalls?: ToolCall[];
  charts?: ChartPayload[];
};

export type ChatRequestPayload = {
  messages: { role: ChatRole; content: string }[];
};

/** Agent NDJSON stream events. */
export type AgentEvent =
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; ok: boolean }
  | { type: "delta"; text: string }
  | { type: "done" };
