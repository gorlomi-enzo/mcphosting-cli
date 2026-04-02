import { MCPServer } from '../types.js';

export class MCPHostingAPI {
  private baseUrl = 'https://mcphosting.com/api';
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    // For MVP, always throw to use static fallback
    // In production, this would make actual HTTP requests
    throw new Error(`API not available - using static fallback`);
    
    // Commented out for MVP - uncomment for production API calls
    /*
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
    */
  }

  async searchMCPs(query: string): Promise<MCPServer[]> {
    try {
      const results = await this.request(`/marketplace/search?q=${encodeURIComponent(query)}`);
      return results.mcps || [];
    } catch (error) {
      // Always fallback to static data for now
      const staticMCPs = this.getStaticMCPs();
      return staticMCPs.filter(mcp => 
        mcp.name.toLowerCase().includes(query.toLowerCase()) ||
        mcp.description.toLowerCase().includes(query.toLowerCase()) ||
        mcp.tools.some(tool => tool.toLowerCase().includes(query.toLowerCase()))
      );
    }
  }

  async getMCPInfo(slug: string): Promise<MCPServer | null> {
    try {
      const result = await this.request(`/marketplace/mcp/${slug}`);
      return result.mcp || null;
    } catch {
      // Fallback to static data
      const staticMCPs = this.getStaticMCPs();
      return staticMCPs.find(mcp => mcp.slug === slug) || null;
    }
  }

  async whoami(): Promise<{ email: string; org?: string } | null> {
    if (!this.token) return null;
    
    try {
      const result = await this.request('/auth/whoami');
      return result.user;
    } catch {
      return null;
    }
  }

  private getStaticMCPs(): MCPServer[] {
    // Curated list of popular MCP servers for fallback
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
    ];
  }
}