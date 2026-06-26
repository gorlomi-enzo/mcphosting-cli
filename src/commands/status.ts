import { Command } from 'commander'
import { getAuthenticatedAPI } from '../lib/auth.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

export function createStatusCommand(): Command {
  return new Command('status')
    .description('Check the status of a deployed MCP server')
    .argument('<slug-or-id>', 'Server slug or ID')
    .option('--json', 'Output as JSON')
    .action(async (slugOrId: string, options) => {
      const isJson = options.json || Logger.isJsonMode
      const { api } = getAuthenticatedAPI()
      const spinner = Logger.spinner(`Checking status of ${chalk.cyan(slugOrId)}...`)

      try {
        const server = await api.getServer(slugOrId)
        spinner.stop()

        if (isJson) {
          Logger.json(server)
          return
        }

        console.log('')
        console.log(chalk.bold(`📡 ${server.name || server.slug}`))
        console.log('')

        const statusIcon = server.status === 'active' ? chalk.green('● Active') :
                           server.status === 'deploying' ? chalk.yellow('◐ Deploying') :
                           server.status === 'stopped' ? chalk.dim('○ Stopped') :
                           chalk.red('✗ ' + server.status)

        const info = [
          { Property: 'Status', Value: statusIcon },
          { Property: 'Slug', Value: server.slug },
          { Property: 'URL', Value: server.url || '—' },
        ]

        if (server.sseUrl) {
          info.push({ Property: 'SSE URL', Value: server.sseUrl })
        }
        if (server.streamableUrl) {
          info.push({ Property: 'Streamable', Value: server.streamableUrl })
        }
        if (server.githubUrl) {
          info.push({ Property: 'GitHub', Value: server.githubUrl })
        }

        info.push(
          { Property: 'Created', Value: server.createdAt ? new Date(server.createdAt).toLocaleString() : '—' },
          { Property: 'Updated', Value: server.updatedAt ? new Date(server.updatedAt).toLocaleString() : '—' },
        )

        Logger.table(info)

        if (server.tools && server.tools.length > 0) {
          console.log('')
          console.log(chalk.yellow('🔧 Tools:'))
          server.tools.forEach(tool => {
            console.log(`  • ${tool}`)
          })
        }

        if (server.envVars && server.envVars.length > 0) {
          console.log('')
          console.log(chalk.yellow('🔑 Environment Variables:'))
          server.envVars.forEach(env => {
            console.log(`  ${env.key} = ${env.masked ? '••••••••' : '(set)'}`)
          })
        }

        console.log('')
      } catch (error: any) {
        spinner.fail('Failed to get status')
        Logger.error(error.message)
        process.exit(1)
      }
    })
}
