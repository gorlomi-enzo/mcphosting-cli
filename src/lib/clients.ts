import { readFile, writeFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { mkdir } from 'fs/promises';
import { ClientConfig, ClaudeConfig, CursorConfig, MCPServerEntry, SupportedClient } from '../types.js';
import { Logger } from './logger.js';

export class ClientManager {
  private static getClientPaths(): Record<SupportedClient, string> {
    const home = homedir();
    const platform = process.platform;
    
    const paths: Record<SupportedClient, string> = {
      claude: platform === 'win32' 
        ? join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json')
        : join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
      cursor: join(home, '.cursor', 'mcp.json'),
      vscode: join(process.cwd(), '.vscode', 'mcp.json'),
      openclaw: join(home, '.openclaw', 'mcp.json'),
      chatgpt: '' // Web-based, no local config
    };

    return paths;
  }

  static async detectInstalledClients(): Promise<ClientConfig[]> {
    const paths = this.getClientPaths();
    const clients: ClientConfig[] = [];

    for (const [name, path] of Object.entries(paths)) {
      if (name === 'chatgpt') continue; // Skip web-based clients
      
      try {
        await access(path);
        clients.push({ name, configPath: path, exists: true });
      } catch {
        clients.push({ name, configPath: path, exists: false });
      }
    }

    return clients;
  }

  static async addToClient(
    client: SupportedClient,
    slug: string,
    url: string
  ): Promise<boolean> {
    if (client === 'chatgpt') {
      Logger.info('ChatGPT Setup Instructions:');
      console.log(`
1. Open ChatGPT in your browser
2. Go to Settings → Apps → Connect an app
3. Enter this URL: ${url}
4. Follow the prompts to authorize the MCP server
      `);
      return true;
    }

    const paths = this.getClientPaths();
    const configPath = paths[client];
    
    if (!configPath) {
      throw new Error(`Unsupported client: ${client}`);
    }

    const serverEntry: MCPServerEntry = {
      command: 'npx',
      args: ['-y', 'mcphosting-cli', 'proxy', url],
      env: {}
    };

    try {
      // Ensure directory exists
      await mkdir(dirname(configPath), { recursive: true });

      let config: ClaudeConfig | CursorConfig = { mcpServers: {} };

      // Read existing config if it exists
      try {
        const configContent = await readFile(configPath, 'utf-8');
        config = JSON.parse(configContent);
        if (!config.mcpServers) {
          config.mcpServers = {};
        }
      } catch {
        // File doesn't exist or is invalid, use default config
      }

      // Add the MCP server
      config.mcpServers[slug] = serverEntry;

      // Write back to file
      await writeFile(configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      Logger.error(`Failed to configure ${client}: ${error}`);
      return false;
    }
  }

  static async removeFromClient(
    client: SupportedClient,
    slug: string
  ): Promise<boolean> {
    if (client === 'chatgpt') {
      Logger.info('To remove from ChatGPT:');
      console.log(`
1. Open ChatGPT in your browser
2. Go to Settings → Apps
3. Find and disconnect the MCP server: ${slug}
      `);
      return true;
    }

    const paths = this.getClientPaths();
    const configPath = paths[client];
    
    if (!configPath) {
      throw new Error(`Unsupported client: ${client}`);
    }

    try {
      const configContent = await readFile(configPath, 'utf-8');
      const config: ClaudeConfig | CursorConfig = JSON.parse(configContent);

      if (config.mcpServers && config.mcpServers[slug]) {
        delete config.mcpServers[slug];
        await writeFile(configPath, JSON.stringify(config, null, 2));
        return true;
      }

      return false;
    } catch (error) {
      Logger.error(`Failed to remove from ${client}: ${error}`);
      return false;
    }
  }

  static async removeFromAllClients(slug: string): Promise<string[]> {
    const clients = await this.detectInstalledClients();
    const removed: string[] = [];

    for (const client of clients) {
      if (!client.exists) continue;
      
      try {
        const success = await this.removeFromClient(client.name as SupportedClient, slug);
        if (success) {
          removed.push(client.name);
        }
      } catch (error) {
        Logger.warning(`Failed to remove from ${client.name}: ${error}`);
      }
    }

    return removed;
  }

  static resolveUrl(urlOrSlug: string): string {
    // If it's already a full URL, return as-is
    if (urlOrSlug.startsWith('http://') || urlOrSlug.startsWith('https://')) {
      return urlOrSlug;
    }

    // Otherwise, assume it's a slug and construct the mcphost.dev URL
    return `https://${urlOrSlug}.mcphost.dev`;
  }

  static extractSlug(url: string): string {
    // Extract slug from URLs like https://myserver.mcphost.dev
    if (url.includes('.mcphost.dev')) {
      const match = url.match(/https?:\/\/([^.]+)\.mcphost\.dev/);
      if (match) {
        return match[1];
      }
    }

    // For other URLs, use the hostname or a hash of the URL
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/\./g, '-');
    } catch {
      // If URL parsing fails, create a simple hash
      return url.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20);
    }
  }
}