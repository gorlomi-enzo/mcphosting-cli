import axios, { AxiosError } from 'axios'
import { MCPServer, DeployResult, ServerProject, APIKey, LogEntry } from '../types.js'

const API_BASE = process.env.MCPHOSTING_API_URL || 'https://mcphosting.com'

export class MCPHostingAPI {
  private token: string | null = null

  constructor(token?: string) {
    this.token = token || null
  }

  setToken(token: string) {
    this.token = token
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'mcphosting-cli/1.0.0',
    }
    if (this.token) {
      h['Authorization'] = `Bearer ${this.token}`
    }
    return h
  }

  private handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status
      const message = error.response?.data?.error || error.response?.data?.message || error.message

      if (status === 401) {
        throw new Error('Authentication required. Run `mcphosting login` first.')
      }
      if (status === 403) {
        throw new Error('Access denied. Check your permissions.')
      }
      if (status === 404) {
        throw new Error('Not found. Check the server slug or ID.')
      }
      if (status === 429) {
        throw new Error('Rate limited. Please wait a moment and try again.')
      }
      throw new Error(`API error (${status}): ${message}`)
    }
    throw error
  }

  // --- Auth ---

  async login(email: string, password: string): Promise<{ token: string; user: { email: string } }> {
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/cli-login`, { email, password })
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async whoami(): Promise<{ email: string; org?: string } | null> {
    if (!this.token) return null
    try {
      const { data } = await axios.get(`${API_BASE}/api/auth/whoami`, { headers: this.headers })
      return data.user || null
    } catch {
      return null
    }
  }

  // --- Deploy ---

  async deploy(params: {
    name: string
    githubUrl?: string
    baseApiUrl?: string
    authType?: 'none' | 'api_key' | 'oauth'
    envVars?: Record<string, string>
  }): Promise<DeployResult> {
    try {
      // If GitHub URL, use GitHub deploy
      if (params.githubUrl) {
        const { data } = await axios.post(`${API_BASE}/api/cli/github/deploy`, {
          repo_url: params.githubUrl,
          auto_detect: true,
        }, { headers: this.headers })
        return data
      }

      // Otherwise use regular deploy
      const { data } = await axios.post(`${API_BASE}/api/cli/deploy`, params, { headers: this.headers })
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  // --- Server Management ---

  async listServers(): Promise<ServerProject[]> {
    try {
      const { data } = await axios.get(`${API_BASE}/api/mcp/projects`, { headers: this.headers })
      return data.projects || []
    } catch (error) {
      this.handleError(error)
    }
  }

  async getServer(idOrSlug: string): Promise<ServerProject> {
    try {
      const { data } = await axios.get(`${API_BASE}/api/mcp/projects/${idOrSlug}`, { headers: this.headers })
      return data.project || data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getServerLogs(idOrSlug: string, lines: number = 50): Promise<LogEntry[]> {
    try {
      const { data } = await axios.get(`${API_BASE}/api/mcp/projects/${idOrSlug}/logs?lines=${lines}`, { headers: this.headers })
      return data.logs || []
    } catch (error) {
      this.handleError(error)
    }
  }

  // --- Connection Info ---

  async connect(slug: string): Promise<any> {
    try {
      const { data } = await axios.post(`${API_BASE}/api/mcp/connect`, { slug }, { headers: this.headers })
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getConnectionInfo(slug: string): Promise<any> {
    try {
      const { data } = await axios.get(`${API_BASE}/api/cli/info/${slug}`, { headers: this.headers })
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  // --- Env Vars ---

  async listEnvVars(projectId: string): Promise<{ key: string; masked: boolean }[]> {
    try {
      const { data } = await axios.get(`${API_BASE}/api/mcp/projects/${projectId}/env-vars`, { headers: this.headers })
      return data.envVars || []
    } catch (error) {
      this.handleError(error)
    }
  }

  async addEnvVar(projectId: string, key: string, value: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE}/api/mcp/projects/${projectId}/env-vars`,
        { key, value },
        { headers: this.headers }
      )
    } catch (error) {
      this.handleError(error)
    }
  }

  async removeEnvVar(projectId: string, key: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE}/api/mcp/projects/${projectId}/env-vars/${key}`,
        { headers: this.headers }
      )
    } catch (error) {
      this.handleError(error)
    }
  }

  // --- API Keys ---

  async getAPIKeys(): Promise<APIKey[]> {
    try {
      const { data } = await axios.get(`${API_BASE}/api/keys`, { headers: this.headers })
      return data.keys || []
    } catch (error) {
      this.handleError(error)
    }
  }

  async createAPIKey(name: string): Promise<APIKey> {
    try {
      const { data } = await axios.post(`${API_BASE}/api/keys`, { name }, { headers: this.headers })
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async deleteAPIKey(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/api/keys/${id}`, { headers: this.headers })
    } catch (error) {
      this.handleError(error)
    }
  }

  // --- Marketplace (static fallback for MVP) ---

  async searchMCPs(query: string): Promise<MCPServer[]> {
    try {
      const { data } = await axios.get(`${API_BASE}/api/marketplace/search?q=${encodeURIComponent(query)}`, { headers: this.headers })
      return data.mcps || []
    } catch {
      // Fallback to static data
      const staticMCPs = this.getStaticMCPs()
      return staticMCPs.filter(mcp =>
        mcp.name.toLowerCase().includes(query.toLowerCase()) ||
        mcp.description.toLowerCase().includes(query.toLowerCase()) ||
        mcp.tools.some(tool => tool.toLowerCase().includes(query.toLowerCase()))
      )
    }
  }

  async getMCPInfo(slug: string): Promise<MCPServer | null> {
    try {
      const { data } = await axios.get(`${API_BASE}/api/marketplace/mcp/${slug}`, { headers: this.headers })
      return data.mcp || null
    } catch {
      const staticMCPs = this.getStaticMCPs()
      return staticMCPs.find(mcp => mcp.slug === slug) || null
    }
  }

  private getStaticMCPs(): MCPServer[] {
    return [
      {
        slug: 'github',
        name: 'GitHub MCP',
        description: 'Access GitHub repositories, issues, and pull requests',
        url: 'https://github.mcphost.dev',
        tools: ['read_file', 'list_repos', 'create_issue', 'list_issues'],
        installs: 15420,
        author: 'MCPHosting'
      },
      {
        slug: 'slack',
        name: 'Slack MCP',
        description: 'Send messages and manage Slack workspaces',
        url: 'https://slack.mcphost.dev',
        tools: ['send_message', 'list_channels', 'get_history'],
        installs: 8930,
        author: 'MCPHosting'
      },
      {
        slug: 'notion',
        name: 'Notion MCP',
        description: 'Read and write Notion pages and databases',
        url: 'https://notion.mcphost.dev',
        tools: ['read_page', 'create_page', 'query_database'],
        installs: 12450,
        author: 'MCPHosting'
      },
      {
        slug: 'stripe',
        name: 'Stripe MCP',
        description: 'Access Stripe payment and customer data',
        url: 'https://stripe.mcphost.dev',
        tools: ['get_customer', 'list_payments', 'create_invoice'],
        installs: 6720,
        author: 'MCPHosting'
      },
      {
        slug: 'postgres',
        name: 'PostgreSQL MCP',
        description: 'Query PostgreSQL databases safely',
        url: 'https://postgres.mcphost.dev',
        tools: ['query', 'describe_table', 'list_tables'],
        installs: 9180,
        author: 'MCPHosting'
      },
      {
        slug: 'filesystem',
        name: 'Filesystem MCP',
        description: 'Read and write files securely',
        url: 'https://filesystem.mcphost.dev',
        tools: ['read_file', 'write_file', 'list_directory'],
        installs: 18950,
        author: 'MCPHosting'
      }
    ]
  }
}
