import { Command } from 'commander'
import chalk from 'chalk'

import { createLoginCommand } from './commands/login.js'
import { createLogoutCommand } from './commands/logout.js'
import { createDeployCommand } from './commands/deploy.js'
import { createInitCommand } from './commands/init.js'
import { createConnectCommand, createDisconnectCommand } from './commands/connect.js'
import { createListCommand } from './commands/list.js'
import { createStatusCommand } from './commands/status.js'
import { createLogsCommand } from './commands/logs.js'
import { createEnvCommand } from './commands/env.js'
import { createKeysCommand } from './commands/keys.js'
import { createSearchCommand, createInfoCommand } from './commands/search.js'
import { createImportCommand } from './commands/import.js'
import { createProxyCommand } from './commands/proxy.js'
import { Logger } from './lib/logger.js'

const program = new Command()

program
  .name('mcphosting')
  .description('Deploy and manage MCP servers from the terminal')
  .version('1.0.0')
  .configureOutput({
    outputError: (str, write) => {
      write(chalk.red(str))
    }
  })

// --- Core Commands ---
program.addCommand(createLoginCommand())
program.addCommand(createLogoutCommand())
program.addCommand(createDeployCommand())
program.addCommand(createInitCommand())
program.addCommand(createConnectCommand())
program.addCommand(createDisconnectCommand())
program.addCommand(createListCommand())
program.addCommand(createStatusCommand())
program.addCommand(createLogsCommand())
program.addCommand(createEnvCommand())
program.addCommand(createKeysCommand())

// --- Marketplace ---
program.addCommand(createSearchCommand())
program.addCommand(createInfoCommand())

// --- Utilities ---
program.addCommand(createImportCommand())
program.addCommand(createProxyCommand())

// --- Whoami (convenience) ---
program
  .command('whoami')
  .description('Show current logged-in user')
  .action(async () => {
    const { Config } = await import('./lib/config.js')
    const config = new Config()
    const user = config.user
    const token = config.token

    if (!token) {
      Logger.info('Not logged in.')
      Logger.dim(`Run ${chalk.cyan('mcphosting login')} to authenticate.`)
      return
    }

    if (user) {
      Logger.success(`Logged in as ${chalk.bold(user.email)}${user.org ? ` (${user.org})` : ''}`)
    } else {
      Logger.info('Authenticated (user info unavailable)')
    }
  })

// Custom help
program.configureHelp({
  subcommandTerm: (cmd) => chalk.cyan(cmd.name()),
  commandUsage: (cmd) => chalk.yellow(cmd.usage()),
  commandDescription: (cmd) => chalk.dim(cmd.description()),
})

program.addHelpText('after', `
${chalk.bold('Quick Start (one command!):')}
  ${chalk.dim('1.')} ${chalk.cyan('mcphosting login --github')}                     ${chalk.dim('Login with GitHub (recommended)')}
  ${chalk.dim('2.')} ${chalk.cyan('mcphosting deploy --template weather')}          ${chalk.dim('Deploy a template')}
  ${chalk.dim('   ')} ${chalk.dim('Done! URL returned. API key created. Config ready.')}

${chalk.bold('Deploy Options:')}
  ${chalk.cyan('mcphosting deploy')}                              ${chalk.dim('Deploy from current directory')}
  ${chalk.cyan('mcphosting deploy --template crypto')}            ${chalk.dim('Deploy from template')}
  ${chalk.cyan('mcphosting deploy --github <url>')}               ${chalk.dim('Deploy from GitHub repo')}
  ${chalk.cyan('mcphosting deploy --api-url <url>')}              ${chalk.dim('Register external server')}
  ${chalk.cyan('mcphosting deploy --configure')}                  ${chalk.dim('Auto-configure AI clients')}

${chalk.bold('Templates:')}
  ${chalk.cyan('weather')}  ${chalk.cyan('crypto')}  ${chalk.cyan('notion')}  ${chalk.cyan('postgres')}  ${chalk.cyan('blank')}

${chalk.bold('More Commands:')}
  ${chalk.cyan('mcphosting init')}                                ${chalk.dim('Create mcphosting.json')}
  ${chalk.cyan('mcphosting connect <slug>')}                      ${chalk.dim('Connect MCP to AI clients')}
  ${chalk.cyan('mcphosting list')}                                ${chalk.dim('List all servers')}
  ${chalk.cyan('mcphosting status <server>')}                     ${chalk.dim('Check server status')}
  ${chalk.cyan('mcphosting keys create "Key Name"')}              ${chalk.dim('Create API key')}
  ${chalk.cyan('mcphosting search <query>')}                      ${chalk.dim('Search marketplace')}

${chalk.bold('Supported AI Clients:')}
  • ${chalk.green('Claude Desktop')}  • ${chalk.green('Cursor')}  • ${chalk.green('VS Code')}  • ${chalk.green('OpenClaw')}  • ${chalk.green('ChatGPT')}

${chalk.yellow('📚 Docs:')} ${chalk.blue('https://mcphosting.com/docs')}
${chalk.yellow('⭐ GitHub:')} ${chalk.blue('https://github.com/gorlomi-enzo/mcphosting-cli')}
`)

// Global error handling
process.on('uncaughtException', (error) => {
  Logger.error(`Unexpected error: ${error.message}`)
  if (process.env.DEBUG) console.error(error.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  Logger.error(`Unhandled rejection: ${reason}`)
  if (process.env.DEBUG) console.error(reason)
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log('\n')
  Logger.info('Goodbye! 👋')
  process.exit(0)
})

async function main() {
  try {
    await program.parseAsync()
  } catch (error: any) {
    Logger.error(`Command failed: ${error.message}`)
    if (process.env.DEBUG) console.error(error)
    process.exit(1)
  }
}

main()
