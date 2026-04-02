import { Command } from 'commander';
import { MCPHostingAPI } from '../lib/api.js';
import { Config } from '../lib/config.js';
import { Logger } from '../lib/logger.js';
import chalk from 'chalk';

export function createSearchCommand(): Command {
  return new Command('search')
    .description('Search MCP servers in the marketplace')
    .argument('<query>', 'Search query')
    .option('--limit <number>', 'Maximum number of results', '10')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options) => {
      const config = new Config();
      const api = new MCPHostingAPI(config.token);
      const spinner = Logger.spinner(`Searching for "${query}"...`);

      try {
        const results = await api.searchMCPs(query);
        spinner.succeed(`Found ${results.length} MCP server(s)`);

        if (results.length === 0) {
          Logger.info('No MCP servers found matching your query');
          Logger.dim('Try searching for: github, slack, notion, stripe, postgres, filesystem');
          return;
        }

        const limit = parseInt(options.limit);
        const limitedResults = results.slice(0, limit);

        if (options.json) {
          Logger.json(limitedResults);
          return;
        }

        console.log('');
        Logger.bold(`🔍 MCP Marketplace Search Results`);
        console.log('');

        limitedResults.forEach((server, index) => {
          console.log(chalk.cyan(`${index + 1}. ${server.name}`));
          console.log(`   ${chalk.dim(server.description)}`);
          console.log(`   ${chalk.yellow('Slug:')} ${server.slug} | ${chalk.yellow('Installs:')} ${server.installs.toLocaleString()} | ${chalk.yellow('Author:')} ${server.author}`);
          console.log(`   ${chalk.green('Tools:')} ${server.tools.join(', ')}`);
          
          if (server.url) {
            console.log(`   ${chalk.blue('Connect:')} ${chalk.dim(`mcphost connect ${server.slug}`)}`);
          }
          
          console.log('');
        });

        if (results.length > limit) {
          Logger.dim(`Showing ${limit} of ${results.length} results. Use --limit to see more.`);
        }

        Logger.info('Use `mcphost info <slug>` for detailed information');
        Logger.info('Use `mcphost connect <slug>` to install');

      } catch (error) {
        spinner.fail('Search failed');
        Logger.error(`Error: ${error}`);
        process.exit(1);
      }
    });
}

export function createInfoCommand(): Command {
  return new Command('info')
    .description('Show detailed information about an MCP server')
    .argument('<slug>', 'MCP server slug')
    .option('--json', 'Output as JSON')
    .action(async (slug: string, options) => {
      const config = new Config();
      const api = new MCPHostingAPI(config.token);
      const spinner = Logger.spinner(`Getting info for ${slug}...`);

      try {
        const server = await api.getMCPInfo(slug);
        
        if (!server) {
          spinner.fail(`MCP server not found: ${slug}`);
          Logger.info('Use `mcphost search <query>` to find servers');
          return;
        }

        spinner.succeed('Found server info');

        if (options.json) {
          Logger.json(server);
          return;
        }

        console.log('');
        console.log(chalk.bold.cyan(`📦 ${server.name}`));
        console.log(chalk.dim(server.description));
        console.log('');

        const infoTable = [
          { Property: 'Slug', Value: server.slug },
          { Property: 'Author', Value: server.author },
          { Property: 'Installs', Value: server.installs.toLocaleString() },
          { Property: 'Tools', Value: server.tools.length.toString() }
        ];

        if (server.url) {
          infoTable.push({ Property: 'URL', Value: server.url });
        }

        Logger.table(infoTable);

        console.log('');
        console.log(chalk.yellow('🔧 Available Tools:'));
        server.tools.forEach(tool => {
          console.log(`  • ${tool}`);
        });

        console.log('');
        console.log(chalk.green('💡 Quick Start:'));
        console.log(chalk.dim(`  mcphost connect ${server.slug}`));

        // Check if already connected
        const connection = config.findConnection(slug);
        if (connection) {
          console.log('');
          console.log(chalk.blue('ℹ️  Already connected to:'), connection.clients.join(', '));
        }

      } catch (error) {
        spinner.fail('Failed to get server info');
        Logger.error(`Error: ${error}`);
        process.exit(1);
      }
    });
}