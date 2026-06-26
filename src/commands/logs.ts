import { Command } from 'commander'
import { getAuthenticatedAPI } from '../lib/auth.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

export function createLogsCommand(): Command {
  return new Command('logs')
    .description('View logs for a deployed MCP server')
    .argument('<slug-or-id>', 'Server slug or ID')
    .option('-n, --lines <number>', 'Number of log lines to show', '50')
    .option('--json', 'Output as JSON')
    .action(async (slugOrId: string, options) => {
      const isJson = options.json || Logger.isJsonMode
      const { api } = getAuthenticatedAPI()
      const lines = parseInt(options.lines)
      const spinner = Logger.spinner(`Fetching logs for ${chalk.cyan(slugOrId)}...`)

      try {
        const logs = await api.getServerLogs(slugOrId, lines)
        spinner.stop()

        if (logs.length === 0) {
          if (isJson) {
            console.log(JSON.stringify({ success: true, logs: [] }))
          } else {
            Logger.info('No logs available yet.')
          }
          return
        }

        if (isJson) {
          Logger.json(logs)
          return
        }

        console.log('')
        console.log(chalk.bold(`📜 Logs: ${slugOrId}`))
        console.log(chalk.dim('─'.repeat(60)))
        console.log('')

        for (const entry of logs) {
          const time = chalk.dim(new Date(entry.timestamp).toLocaleTimeString())
          const level = entry.level === 'error' ? chalk.red('ERR') :
                        entry.level === 'warn'  ? chalk.yellow('WRN') :
                        entry.level === 'debug' ? chalk.dim('DBG') :
                        chalk.blue('INF')

          console.log(`${time} ${level} ${entry.message}`)
        }

        console.log('')
        console.log(chalk.dim(`Showing last ${logs.length} entries`))
        console.log('')

      } catch (error: any) {
        spinner.fail('Failed to fetch logs')
        Logger.error(error.message)
        process.exit(1)
      }
    })
}
