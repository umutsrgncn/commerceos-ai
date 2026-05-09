export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ChatRequestPayload = {
  messages: { role: ChatRole; content: string }[];
};
