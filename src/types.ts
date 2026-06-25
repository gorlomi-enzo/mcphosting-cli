export interface MCPConfig {
  token?: string
  user?: {
    email: string
    org?: string
  }
}

export interface MCPConnection {
  id: string
  slug: string
  url: string
  clients: string[]
  addedAt: number
}

export interface ClientConfig {
  name: string
  configPath: string
  exists: boolean
}

export interface MCPServer {
  slug: string
  name: string
  description: string
  url?: string
  tools: string[]
  installs: number
  author: string
}

export interface MCPServerEntry {
  command: string
  args: string[]
  env: Record<string, string>
}

export interface ClaudeConfig {
  mcpServers: Record<string, MCPServerEntry>
}

export interface CursorConfig {
  mcpServers: Record<string, MCPServerEntry>
}

export type SupportedClient = 'claude' | 'cursor' | 'vscode' | 'openclaw' | 'chatgpt'

// --- Deploy & Server Management Types ---

export interface DeployResult {
  id: string
  slug: string
  name: string
  status: 'deploying' | 'deployed' | 'failed'
  url: string
  sseUrl?: string
  streamableUrl?: string
  createdAt: string
}

export interface ServerProject {
  id: string
  slug: string
  name: string
  status: 'active' | 'stopped' | 'deploying' | 'failed'
  url: string
  sseUrl?: string
  streamableUrl?: string
  githubUrl?: string
  createdAt: string
  updatedAt: string
  tools?: string[]
  envVars?: { key: string; masked: boolean }[]
}

export interface APIKey {
  id: string
  name: string
  key?: string // Only shown on creation
  prefix: string
  createdAt: string
  lastUsedAt?: string
}

export interface DetectedMCP {
  name: string
  hasMcpSdk: boolean
  configFiles: string[]
  packageJson?: any
  mcpConfig?: any
  runtime: 'node' | 'python' | 'unknown'
  entryPoint?: string
}

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
}

export interface OneClickDeployResult {
  ok: boolean
  projectId: string
  slug: string
  name: string
  connectionUrl: string
  sseUrl?: string
  streamableUrl?: string
  status: string
  apiKey?: {
    id: string
    name: string
    key: string
    prefix: string
  }
  githubRepoUrl?: string
  template?: string
  vercelDeployUrl?: string
  clientConfig: {
    claude: Record<string, any>
    cursor: Record<string, any>
    openclaw: Record<string, any>
  }
}
