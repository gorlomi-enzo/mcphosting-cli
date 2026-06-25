import { Command } from 'commander'
import { Config } from '../lib/config.js'
import { getAuthenticatedAPI } from '../lib/auth.js'
import { isAuthenticated } from '../lib/auth.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

export function createListCommand(): Command {
  return new Command('list')
    .description('List your MCP servers')
    .option('--local', 'Show locally connected servers only')
    .option('--remote', 'Show deployed servers only (requires login)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      // Default: show both local connections and remote servers
      const showLocal = options.local || (!options.local && !options.remote)
      const showRemote = options.remote || (!options.local && !options.remote)

      // --- Local connections ---
      if (showLocal) {
        const config = new Config()
        const connections = config.connections

        if (connections.length > 0) {
          if (options.json && !showRemote) {
            Logger.json(connections)
            return
          }

          console.log('')
          Logger.bold(`📋 Connected MCP Servers (${connections.length})`)
          console.log('')

          const tableData = connections.map(conn => ({
            Slug: conn.slug,
            URL: conn.url.length > 50 ? conn.url.slice(0, 47) + '...' : conn.url,
            Clients: conn.clients.join(', '),
            Added: new Date(conn.addedAt).toLocaleDateString()
          }))

          Logger.table(tableData)
          console.log('')
        } else if (!showRemote) {
          Logger.info('No local MCP connections.')
          Logger.dim(`Use ${chalk.cyan('mcphosting connect <slug>')} to connect one.`)
          return
        }
      }

      // --- Remote deployed servers ---
      if (showRemote && isAuthenticated()) {
        const { api } = getAuthenticatedAPI()
        const spinner = Logger.spinner('Fetching deployed servers...')

        try {
          const servers = await api.listServers()
          spinner.stop()

          if (servers.length === 0) {
            if (!showLocal) {
              Logger.info('No deployed servers yet.')
              Logger.dim(`Use ${chalk.cyan('mcphosting deploy')} to deploy your first MCP server.`)
            }
            return
          }

          if (options.json) {
            Logger.json(servers)
            return
          }

          Logger.bold(`🖥️  Deployed Servers (${servers.length})`)
          console.log('')

          const tableData = servers.map((s: any) => ({
            Name: s.name || s.slug,
            Status: s.status === 'active' ? chalk.green('● active') :
                    s.status === 'deploying' ? chalk.yellow('◐ deploying') :
                    s.status === 'stopped' ? chalk.dim('○ stopped') :
                    chalk.red('✗ ' + s.status),
            Slug: s.slug,
            URL: (s.url || '').length > 45 ? (s.url || '').slice(0, 42) + '...' : (s.url || ''),
          }))

          Logger.table(tableData)
          console.log('')
        } catch (error: any) {
          spinner.fail('Failed to fetch servers')
          Logger.error(error.message)
        }
      } else if (showRemote && !isAuthenticated()) {
        Logger.dim(`Log in to see deployed servers: ${chalk.cyan('mcphosting login')}`)
        console.log('')
      }
    })
}
