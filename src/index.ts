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
import { createWhoamiCommand } from './commands/whoami.js'
import { createAccountCommand } from './commands/account-status.js'
import { createCompletionsCommand } from './commands/completions.js'
import { Logger } from './lib/logger.js'

const program = new Command()

program
  .name('mcphosting')
  .description('Deploy and manage MCP servers from the terminal')
  .version('1.0.0')
  .option('--json', 'Output all results as JSON (agent-friendly)')
  .option('--silent', 'Suppress interactive output and prompts')
  .configureOutput({
    outputError: (str, write) => {
      if (Logger.isJsonMode) {
        write(JSON.stringify({ success: false, error: str.trim() }))
      } else {
        write(chalk.red(str))
      }
    }
  })
  .hook('preAction', (thisCommand) => {
    // Set global flags from root command
    const rootOpts = program.opts()
    if (rootOpts.json) {
      Logger.jsonMode = true
    }
    if (rootOpts.silent) {
      Logger.silent = true
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

// --- Account ---
program.addCommand(createWhoamiCommand())
program.addCommand(createAccountCommand())

// --- Utilities ---
program.addCommand(createImportCommand())
program.addCommand(createProxyCommand())
program.addCommand(createCompletionsCommand())

// Custom help
program.configureHelp({
  subcommandTerm: (cmd) => chalk.cyan(cmd.name()),
  commandUsage: (cmd) => chalk.yellow(cmd.usage()),
  commandDescription: (cmd) => chalk.dim(cmd.description()),
})

program.addHelpText('after', `
${chalk.bold('Quick Start (one command!):')}
  ${chalk.dim('1.')} ${chalk.cyan('mcphosting login')}                              ${chalk.dim('Authenticate')}
  ${chalk.dim('2.')} ${chalk.cyan('mcphosting deploy --template weather')}          ${chalk.dim('Deploy a template')}
  ${chalk.dim('   ')} ${chalk.dim('Done! URL returned. API key created. Config ready.')}

${chalk.bold('Global Flags:')}
  ${chalk.cyan('--json')}                                         ${chalk.dim('Output as JSON (agent-friendly)')}
  ${chalk.cyan('--silent')}                                       ${chalk.dim('Suppress interactive output')}

${chalk.bold('Environment Variables:')}
  ${chalk.cyan('MCPHOSTING_TOKEN')}                               ${chalk.dim('Auth token (overrides config)')}
  ${chalk.cyan('MCPHOSTING_API_URL')}                             ${chalk.dim('API base URL (default: mcphosting.com)')}

${chalk.bold('Deploy Options:')}
  ${chalk.cyan('mcphosting deploy')}                              ${chalk.dim('Deploy from current directory')}
  ${chalk.cyan('mcphosting deploy --template crypto')}            ${chalk.dim('Deploy from template')}
  ${chalk.cyan('mcphosting deploy --github <url>')}               ${chalk.dim('Deploy from GitHub repo')}
  ${chalk.cyan('mcphosting deploy --api-url <url>')}              ${chalk.dim('Register external server')}
  ${chalk.cyan('mcphosting deploy --configure')}                  ${chalk.dim('Auto-configure AI clients')}

${chalk.bold('Templates:')}
  ${chalk.cyan('weather')}  ${chalk.cyan('crypto')}  ${chalk.cyan('notion')}  ${chalk.cyan('postgres')}  ${chalk.cyan('blank')}

${chalk.bold('Agent Usage:')}
  ${chalk.cyan('mcphosting deploy --template crypto --json')}     ${chalk.dim('Deploy + JSON output')}
  ${chalk.cyan('mcphosting whoami --json')}                       ${chalk.dim('Check auth status')}
  ${chalk.cyan('mcphosting account --json')}                      ${chalk.dim('Account + servers')}
  ${chalk.cyan('mcphosting list --json')}                         ${chalk.dim('List all servers')}

${chalk.bold('More Commands:')}
  ${chalk.cyan('mcphosting init')}                                ${chalk.dim('Create mcphosting.json')}
  ${chalk.cyan('mcphosting connect <slug>')}                      ${chalk.dim('Connect MCP to AI clients')}
  ${chalk.cyan('mcphosting list')}                                ${chalk.dim('List all servers')}
  ${chalk.cyan('mcphosting status <server>')}                     ${chalk.dim('Check server status')}
  ${chalk.cyan('mcphosting keys create "Key Name"')}              ${chalk.dim('Create API key')}
  ${chalk.cyan('mcphosting search <query>')}                      ${chalk.dim('Search marketplace')}
  ${chalk.cyan('mcphosting completions --shell=zsh')}             ${chalk.dim('Shell completions')}

${chalk.bold('Supported AI Clients:')}
  • ${chalk.green('Claude Desktop')}  • ${chalk.green('Cursor')}  • ${chalk.green('VS Code')}  • ${chalk.green('OpenClaw')}  • ${chalk.green('ChatGPT')}

${chalk.yellow('📚 Docs:')} ${chalk.blue('https://mcphosting.com/docs')}
${chalk.yellow('⭐ GitHub:')} ${chalk.blue('https://github.com/gorlomi-enzo/mcphosting-cli')}
`)

// Global error handling
process.on('uncaughtException', (error) => {
  if (Logger.isJsonMode) {
    console.error(JSON.stringify({ success: false, error: error.message }))
  } else {
    Logger.error(`Unexpected error: ${error.message}`)
  }
  if (process.env.DEBUG) console.error(error.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  if (Logger.isJsonMode) {
    console.error(JSON.stringify({ success: false, error: String(reason) }))
  } else {
    Logger.error(`Unhandled rejection: ${reason}`)
  }
  if (process.env.DEBUG) console.error(reason)
  process.exit(1)
})

process.on('SIGINT', () => {
  if (!Logger.isSilent && !Logger.isJsonMode) {
    console.log('\n')
    Logger.info('Goodbye! 👋')
  }
  process.exit(0)
})

async function main() {
  try {
    await program.parseAsync()
  } catch (error: any) {
    if (Logger.isJsonMode) {
      console.error(JSON.stringify({ success: false, error: error.message }))
    } else {
      Logger.error(`Command failed: ${error.message}`)
    }
    if (process.env.DEBUG) console.error(error)
    process.exit(1)
  }
}

main()
