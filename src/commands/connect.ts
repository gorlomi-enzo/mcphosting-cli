import { Command } from 'commander';
import { Config } from '../lib/config.js';
import { ClientManager } from '../lib/clients.js';
import { Logger } from '../lib/logger.js';
import { SupportedClient } from '../types.js';
import chalk from 'chalk';

export function createConnectCommands(): Command {
  const connect = new Command('connect')
    .description('Connect an MCP server to AI clients')
    .argument('<url-or-slug>', 'MCP server URL or slug')
    .option('--client <client>', 'Target specific client (claude, cursor, vscode, openclaw, chatgpt)')
    .option('--name <name>', 'Custom name for the connection')
    .action(async (urlOrSlug: string, options) => {
      const config = new Config();
      const spinner = Logger.spinner('Setting up MCP connection...');
      
      try {
        const url = ClientManager.resolveUrl(urlOrSlug);
        const slug = ClientManager.extractSlug(url);
        const name = options.name || slug;

        // Check if already connected
        const existing = config.findConnection(slug);
        if (existing) {
          spinner.warn(`Already connected to ${slug}`);
          Logger.info(`Use \`mcphost disconnect ${slug}\` to remove first`);
          return;
        }

        const clients: string[] = [];

        if (options.client) {
          // Connect to specific client
          const clientName = options.client as SupportedClient;
          const success = await ClientManager.addToClient(clientName, slug, url);
          
          if (success) {
            clients.push(clientName);
            spinner.succeed(`Connected to ${clientName}`);
          } else {
            spinner.fail(`Failed to connect to ${clientName}`);
            process.exit(1);
          }
        } else {
          // Auto-detect and connect to all available clients
          const detectedClients = await ClientManager.detectInstalledClients();
          const availableClients = detectedClients.filter(c => c.exists);
          
          if (availableClients.length === 0) {
            spinner.warn('No supported clients found');
            Logger.info('Supported clients: Claude Desktop, Cursor, VS Code, OpenClaw');
            Logger.info('Install a client and try again, or use --client chatgpt for web setup');
            return;
          }

          spinner.text = `Configuring ${availableClients.length} client${availableClients.length > 1 ? 's' : ''}...`;
          
          for (const client of availableClients) {
            try {
              const success = await ClientManager.addToClient(
                client.name as SupportedClient, 
                slug, 
                url
              );
              
              if (success) {
                clients.push(client.name);
              }
            } catch (error) {
              Logger.warning(`Failed to configure ${client.name}: ${error}`);
            }
          }
          
          spinner.succeed(`Connected to ${clients.length} client${clients.length > 1 ? 's' : ''}`);
        }

        // Save connection to config
        config.addConnection({
          slug,
          url,
          clients
        });

        Logger.success(`🔗 ${name} connected successfully!`);
        Logger.dim(`   URL: ${url}`);
        Logger.dim(`   Clients: ${clients.join(', ')}`);

        // Growth hacking: show sharing message after successful connection
        console.log('\n' + chalk.green('🎉 Connected! Share with your team:'));
        console.log(chalk.cyan(`npx @mcphosting/cli connect ${urlOrSlug}`));
        console.log('\n' + chalk.yellow('⭐ Star us: ') + chalk.blue('https://github.com/gorlomi-enzo/mcphosting-cli'));
        console.log('');

      } catch (error) {
        spinner.fail('Connection failed');
        Logger.error(`Error: ${error}`);
        process.exit(1);
      }
    });

  return connect;
}

export function createDisconnectCommand(): Command {
  return new Command('disconnect')
    .description('Disconnect an MCP server')
    .argument('<slug-or-id>', 'MCP server slug or connection ID')
    .action(async (slugOrId: string) => {
      const config = new Config();
      const connection = config.findConnection(slugOrId);
      
      if (!connection) {
        Logger.error(`Connection not found: ${slugOrId}`);
        Logger.info('Use `mcphost list` to see active connections');
        return;
      }

      const spinner = Logger.spinner(`Disconnecting ${connection.slug}...`);
      
      try {
        const removedFrom = await ClientManager.removeFromAllClients(connection.slug);
        config.removeConnection(connection.id);
        
        spinner.succeed(`Disconnected ${connection.slug}`);
        
        if (removedFrom.length > 0) {
          Logger.info(`Removed from: ${removedFrom.join(', ')}`);
        }
        
      } catch (error) {
        spinner.fail('Disconnect failed');
        Logger.error(`Error: ${error}`);
      }
    });
}

export function createListCommand(): Command {
  return new Command('list')
    .description('List connected MCP servers')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const config = new Config();
      const connections = config.connections;
      
      if (connections.length === 0) {
        Logger.info('No MCP connections found');
        Logger.dim('Use `mcphost connect <url>` to add one');
        return;
      }

      if (options.json) {
        Logger.json(connections);
        return;
      }

      Logger.bold(`📋 Connected MCP Servers (${connections.length})`);
      console.log('');

      const tableData = connections.map(conn => ({
        Slug: conn.slug,
        URL: conn.url.length > 50 ? conn.url.slice(0, 47) + '...' : conn.url,
        Clients: conn.clients.join(', '),
        Added: new Date(conn.addedAt).toLocaleDateString()
      }));

      Logger.table(tableData);
      
      console.log('');
      Logger.dim('Use `mcphost disconnect <slug>` to remove a connection');
    });
}