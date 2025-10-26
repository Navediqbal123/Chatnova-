
export type MessageRole = 'user' | 'model';

export interface Message {
  role: MessageRole;
  text: string;
  image?: string; // base64 encoded image
}

export interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
}
