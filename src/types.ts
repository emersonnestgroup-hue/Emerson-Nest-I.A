export interface Attachment {
  uuid: string;
  name: string;
  type: string; // "image/png", "text/plain", "application/pdf", etc.
  size: number;
  data: string; // base64 representation
  previewUrl?: string;
}

export interface GroundingSource {
  type: "web" | "maps";
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  sender: "user" | "emerson";
  text: string;
  timestamp: string;
  attachment?: Attachment;
  imageGenerated?: {
    url: string;
    modelUsed: string;
    promptUsed: string;
    isFallback?: boolean;
    reason?: string;
  };
  grounding?: GroundingSource[];
  audioBase64?: string; // Cache for Voice notes tts
  isAudioPlaying?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  webSearchEnabled: boolean;
  mapSearchEnabled: boolean;
}

export type SandboxLang = "javascript" | "math" | "chart-generator";

export interface SandboxExecutionResult {
  stdout: string[];
  error?: string;
  chartData?: any[];
  chartKeys?: string[];
  chartType?: "bar" | "line" | "area";
}
