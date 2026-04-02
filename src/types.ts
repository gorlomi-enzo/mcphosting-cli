export interface MCPConfig {
  token?: string;
  user?: {
    email: string;
    org?: string;
  };
}

export interface MCPConnection {
  id: string;
  slug: string;
  url: string;
  clients: string[];
  addedAt: number;
}

export interface ClientConfig {
  name: string;
  configPath: string;
  exists: boolean;
}

export interface MCPServer {
  slug: string;
  name: string;
  description: string;
  url?: string;
  tools: string[];
  installs: number;
  author: string;
}

export interface MCPServerEntry {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface ClaudeConfig {
  mcpServers: Record<string, MCPServerEntry>;
}

export interface CursorConfig {
  mcpServers: Record<string, MCPServerEntry>;
}

export type SupportedClient = 'claude' | 'cursor' | 'vscode' | 'openclaw' | 'chatgpt';