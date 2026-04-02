import { Command } from 'commander';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { Config } from '../lib/config.js';
import { ClientManager } from '../lib/clients.js';
import { Logger } from '../lib/logger.js';
import chalk from 'chalk';

interface SmitheryConfig {
  servers?: Record<string, {
    url?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
  mcpServers?: Record<string, {
    url?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
}

export function createImportCommand(): Command {
  return new Command('import')
    .description('Import MCP connections from other tools')
    .option('--from <tool>', 'Import from: smithery', 'smithery')
    .option('--dry-run', 'Show what would be imported without actually importing')
    .option('--config-path <path>', 'Custom config file path')
    .action(async (options) => {
      if (options.from !== 'smithery') {
        Logger.error('Only Smithery import is currently supported');
        Logger.info('Usage: mcphost import --from smithery');
        return;
      }

      await importFromSmitery(options);
    });
}

async function importFromSmitery(options: { dryRun?: boolean; configPath?: string }) {
  const config = new Config();
  const spinner = Logger.spinner('Looking for Smithery config...');

  try {
    // Try to find Smithery config
    const smitheryPaths = [
      options.configPath,
      join(homedir(), '.smithery', 'config.json'),
      join(homedir(), '.config', 'smithery', 'config.json'),
      join(homedir(), 'Library', 'Application Support', 'smithery', 'config.json'),
      join(process.cwd(), 'smithery.json'),
      join(process.cwd(), '.smithery.json')
    ].filter(Boolean) as string[];

    let smitheryConfigPath: string | null = null;
    for (const path of smitheryPaths) {
      try {
        await access(path);
        smitheryConfigPath = path;
        break;
      } catch {
        // Continue to next path
      }
    }

    if (!smitheryConfigPath) {
      spinner.fail('Smithery config not found');
      Logger.warning('Searched locations:');
      smitheryPaths.forEach(path => Logger.dim(`  ${path}`));
      Logger.info('\nIf Smithery is installed, you can specify the config path:');
      Logger.info('  mcphost import --from smithery --config-path /path/to/smithery/config.json');
      return;
    }

    spinner.succeed(`Found Smithery config: ${smitheryConfigPath}`);

    // Read and parse Smithery config
    const loadSpinner = Logger.spinner('Reading Smithery config...');
    const configContent = await readFile(smitheryConfigPath, 'utf-8');
    const smitheryConfig: SmitheryConfig = JSON.parse(configContent);
    
    // Extract MCP servers from both possible locations
    const servers = {
      ...smitheryConfig.servers,
      ...smitheryConfig.mcpServers
    };

    if (!servers || Object.keys(servers).length === 0) {
      loadSpinner.warn('No MCP servers found in Smithery config');
      return;
    }

    const serverEntries = Object.entries(servers);
    loadSpinner.succeed(`Found ${serverEntries.length} MCP server(s) in Smithery config`);

    if (options.dryRun) {
      console.log('\n' + chalk.bold('🔍 Preview: Would import the following MCP servers:'));
      console.log('');
      
      serverEntries.forEach(([slug, serverConfig]) => {
        const url = serverConfig.url || `https://${slug}.mcphost.dev`;
        console.log(`• ${chalk.cyan(slug)}`);
        console.log(`  URL: ${chalk.dim(url)}`);
        
        if (serverConfig.command) {
          console.log(`  Command: ${chalk.dim(serverConfig.command + ' ' + (serverConfig.args?.join(' ') || ''))}`);
        }
        
        console.log('');
      });

      Logger.info('Run without --dry-run to perform the import');
      return;
    }

    // Actually import the servers
    const importSpinner = Logger.spinner('Importing MCP servers...');
    let imported = 0;
    let skipped = 0;

    for (const [slug, serverConfig] of serverEntries) {
      try {
        // Check if already exists
        const existing = config.findConnection(slug);
        if (existing) {
          Logger.warning(`Skipping ${slug} - already connected`);
          skipped++;
          continue;
        }

        // Determine URL
        let url = serverConfig.url;
        if (!url) {
          // If no URL but has command, try to extract from args
          if (serverConfig.command === 'npx' && serverConfig.args?.[0] === '@mcphosting/cli') {
            url = serverConfig.args[2]; // Should be the URL after 'proxy'
          } else {
            // Default to mcphost.dev format
            url = `https://${slug}.mcphost.dev`;
          }
        }

        if (!url) {
          Logger.warning(`Skipping ${slug} - no URL found`);
          skipped++;
          continue;
        }

        // Connect to available clients
        const detectedClients = await ClientManager.detectInstalledClients();
        const availableClients = detectedClients.filter(c => c.exists);
        const connectedClients: string[] = [];

        for (const client of availableClients) {
          try {
            const success = await ClientManager.addToClient(
              client.name as any, 
              slug, 
              url
            );
            
            if (success) {
              connectedClients.push(client.name);
            }
          } catch (error) {
            // Continue with other clients
          }
        }

        // Save connection
        config.addConnection({
          slug,
          url,
          clients: connectedClients
        });

        imported++;

      } catch (error) {
        Logger.warning(`Failed to import ${slug}: ${error}`);
        skipped++;
      }
    }

    importSpinner.succeed('Import completed');
    
    Logger.success(`✅ Imported ${imported} MCP server(s)`);
    if (skipped > 0) {
      Logger.warning(`⚠️  Skipped ${skipped} server(s)`);
    }

    console.log('');
    Logger.info('Use `mcphost list` to see your imported connections');
    
    // Growth hacking message
    console.log('\n' + chalk.green('🎉 Welcome to MCPHosting! Share with your team:'));
    console.log(chalk.cyan('npx @mcphosting/cli import --from smithery'));
    console.log('\n' + chalk.yellow('⭐ Star us: ') + chalk.blue('https://github.com/gorlomi-enzo/mcphosting-cli'));
    console.log('');

  } catch (error) {
    spinner.fail('Import failed');
    Logger.error(`Error: ${error}`);
    
    if (error instanceof SyntaxError) {
      Logger.warning('Invalid JSON in Smithery config file');
    }
    
    process.exit(1);
  }
}