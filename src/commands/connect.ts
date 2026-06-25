import { Command } from 'commander'
import { Config } from '../lib/config.js'
import { ClientManager } from '../lib/clients.js'
import { Logger } from '../lib/logger.js'
import { SupportedClient } from '../types.js'
import chalk from 'chalk'

export function createConnectCommand(): Command {
  return new Command('connect')
    .description('Connect an MCP server to your AI clients')
    .argument('<url-or-slug>', 'MCP server URL or slug (e.g. github, notion, https://my-mcp.com)')
    .option('--client <client>', 'Target specific client: claude, cursor, vscode, openclaw, chatgpt')
    .option('--name <name>', 'Custom name for the connection')
    .action(async (urlOrSlug: string, options) => {
      const config = new Config()
      const spinner = Logger.spinner('Setting up MCP connection...')

      try {
        const url = ClientManager.resolveUrl(urlOrSlug)
        const slug = ClientManager.extractSlug(url)
        const name = options.name || slug

        // Check if already connected
        const existing = config.findConnection(slug)
        if (existing) {
          spinner.warn(`Already connected to ${chalk.cyan(slug)}`)
          Logger.info(`Use ${chalk.cyan(`mcphosting disconnect ${slug}`)} to remove first`)
          return
        }

        const clients: string[] = []

        if (options.client) {
          const clientName = options.client as SupportedClient
          const success = await ClientManager.addToClient(clientName, slug, url)

          if (success) {
            clients.push(clientName)
            spinner.succeed(`Connected ${chalk.bold(name)} to ${chalk.green(clientName)}`)
          } else {
            spinner.fail(`Failed to connect to ${clientName}`)
            process.exit(1)
          }
        } else {
          // Auto-detect and connect to all available clients
          const detectedClients = await ClientManager.detectInstalledClients()
          const availableClients = detectedClients.filter(c => c.exists)

          if (availableClients.length === 0) {
            spinner.warn('No supported AI clients detected')
            Logger.info('Supported: Claude Desktop, Cursor, VS Code, OpenClaw')
            Logger.info(`Use ${chalk.cyan('--client chatgpt')} for web-based setup`)
            return
          }

          spinner.text = `Configuring ${availableClients.length} client${availableClients.length > 1 ? 's' : ''}...`

          for (const client of availableClients) {
            try {
              const success = await ClientManager.addToClient(
                client.name as SupportedClient,
                slug,
                url
              )
              if (success) {
                clients.push(client.name)
              }
            } catch (error) {
              Logger.warning(`Failed to configure ${client.name}: ${error}`)
            }
          }

          spinner.succeed(`Connected ${chalk.bold(name)} to ${clients.length} client${clients.length > 1 ? 's' : ''}`)
        }

        // Save connection
        config.addConnection({ slug, url, clients })

        console.log('')
        Logger.info(`  URL: ${chalk.dim(url)}`)
        Logger.info(`  Clients: ${chalk.dim(clients.join(', '))}`)
        console.log('')
        console.log(chalk.green('🎉 Share with your team:'))
        console.log(chalk.cyan(`   npx mcphosting-cli connect ${urlOrSlug}`))
        console.log('')

      } catch (error: any) {
        spinner.fail('Connection failed')
        Logger.error(error.message)
        process.exit(1)
      }
    })
}

export function createDisconnectCommand(): Command {
  return new Command('disconnect')
    .description('Disconnect an MCP server')
    .argument('<slug-or-id>', 'MCP server slug or connection ID')
    .action(async (slugOrId: string) => {
      const config = new Config()
      const connection = config.findConnection(slugOrId)

      if (!connection) {
        Logger.error(`Connection not found: ${slugOrId}`)
        Logger.info(`Use ${chalk.cyan('mcphosting list')} to see active connections`)
        return
      }

      const spinner = Logger.spinner(`Disconnecting ${connection.slug}...`)

      try {
        const removedFrom = await ClientManager.removeFromAllClients(connection.slug)
        config.removeConnection(connection.id)

        spinner.succeed(`Disconnected ${chalk.bold(connection.slug)}`)

        if (removedFrom.length > 0) {
          Logger.info(`Removed from: ${removedFrom.join(', ')}`)
        }
      } catch (error: any) {
        spinner.fail('Disconnect failed')
        Logger.error(error.message)
      }
    })
}
