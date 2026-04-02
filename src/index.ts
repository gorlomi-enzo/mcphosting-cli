import { Command } from 'commander';
import { createAuthCommands, createLegacyAuthCommands } from './commands/auth.js';
import { 
  createConnectCommands, 
  createDisconnectCommand, 
  createListCommand 
} from './commands/connect.js';
import { createImportCommand } from './commands/import.js';
import { createProxyCommand } from './commands/proxy.js';
import { createSearchCommand, createInfoCommand } from './commands/search.js';
import { 
  createServersCommand, 
  createKeysCommand, 
  createPublishCommand 
} from './commands/servers.js';
import { Logger } from './lib/logger.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('mcphost')
  .description('Connect AI agents to MCP servers. Browse, install, and manage Model Context Protocol servers.')
  .version('0.1.0')
  .configureOutput({
    outputError: (str, write) => {
      // Ensure errors go to stderr
      write(chalk.red(str));
    }
  });

// Add the main commands
program.addCommand(createConnectCommands());
program.addCommand(createDisconnectCommand());
program.addCommand(createListCommand());
program.addCommand(createImportCommand());
program.addCommand(createProxyCommand());
program.addCommand(createSearchCommand());
program.addCommand(createInfoCommand());

// Add server management commands
program.addCommand(createServersCommand());
program.addCommand(createKeysCommand());
program.addCommand(createPublishCommand());

// Add auth commands both as subcommands and top-level (backwards compatibility)
program.addCommand(createAuthCommands());
const [login, logout, whoami] = createLegacyAuthCommands();
program.addCommand(login);
program.addCommand(logout);
program.addCommand(whoami);

// Custom help
program.configureHelp({
  subcommandTerm: (cmd) => chalk.cyan(cmd.name()),
  commandUsage: (cmd) => {
    const usage = cmd.usage();
    return chalk.yellow(usage);
  },
  commandDescription: (cmd) => {
    return chalk.dim(cmd.description());
  }
});

// Add custom help examples
program.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('mcphost connect github')}                    ${chalk.dim('Connect to GitHub MCP server')}
  ${chalk.cyan('mcphost connect https://my-mcp.example.com')}  ${chalk.dim('Connect to custom MCP server')}
  ${chalk.cyan('mcphost connect slack --client claude')}      ${chalk.dim('Connect Slack MCP only to Claude')}
  ${chalk.cyan('mcphost list')}                             ${chalk.dim('List all connected MCP servers')}
  ${chalk.cyan('mcphost search github')}                    ${chalk.dim('Search marketplace for MCP servers')}
  ${chalk.cyan('mcphost info notion')}                      ${chalk.dim('Get details about Notion MCP')}
  ${chalk.cyan('mcphost import --from smithery')}           ${chalk.dim('Import connections from Smithery')}
  ${chalk.cyan('mcphost disconnect github')}               ${chalk.dim('Remove GitHub MCP connection')}

${chalk.bold('Supported AI Clients:')}
  • ${chalk.green('Claude Desktop')} - Auto-configured via claude_desktop_config.json
  • ${chalk.green('Cursor')} - Auto-configured via .cursor/mcp.json  
  • ${chalk.green('VS Code')} - Configured via .vscode/mcp.json
  • ${chalk.green('OpenClaw')} - Auto-configured via ~/.openclaw/mcp.json
  • ${chalk.green('ChatGPT')} - Manual setup with web instructions

${chalk.bold('Get Started:')}
  ${chalk.dim('1.')} ${chalk.cyan('mcphost search <topic>')}     ${chalk.dim('Find MCP servers')}
  ${chalk.dim('2.')} ${chalk.cyan('mcphost connect <slug>')}     ${chalk.dim('Connect to your AI clients')}
  ${chalk.dim('3.')} ${chalk.cyan('mcphost list')}              ${chalk.dim('View your connections')}

${chalk.yellow('⭐ Star us:')} ${chalk.blue('https://github.com/gorlomi-enzo/mcphosting-cli')}
${chalk.yellow('📚 Docs:')} ${chalk.blue('https://mcphosting.com/docs')}
`);

// Global error handling
process.on('uncaughtException', (error) => {
  Logger.error(`Uncaught error: ${error.message}`);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  Logger.error(`Unhandled rejection: ${reason}`);
  if (process.env.DEBUG) {
    console.error(reason);
  }
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n');
  Logger.info('Goodbye! 👋');
  process.exit(0);
});

// Parse CLI arguments
async function main() {
  try {
    await program.parseAsync();
  } catch (error) {
    Logger.error(`Command failed: ${error}`);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

main();