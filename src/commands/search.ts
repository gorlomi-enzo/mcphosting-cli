import { Command } from 'commander'
import { MCPHostingAPI } from '../lib/api.js'
import { Config } from '../lib/config.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

export function createSearchCommand(): Command {
  return new Command('search')
    .description('Search MCP servers in the marketplace')
    .argument('<query>', 'Search query')
    .option('--limit <number>', 'Maximum number of results', '10')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options) => {
      const config = new Config()
      const api = new MCPHostingAPI(config.token)
      const spinner = Logger.spinner(`Searching for "${query}"...`)

      try {
        const results = await api.searchMCPs(query)
        spinner.succeed(`Found ${results.length} MCP server(s)`)

        if (results.length === 0) {
          Logger.info('No MCP servers found.')
          Logger.dim('Try: github, slack, notion, stripe, postgres, filesystem')
          return
        }

        const limit = parseInt(options.limit)
        const limitedResults = results.slice(0, limit)

        if (options.json) {
          Logger.json(limitedResults)
          return
        }

        console.log('')
        Logger.bold('🔍 Marketplace Results')
        console.log('')

        limitedResults.forEach((server, index) => {
          console.log(chalk.cyan(`${index + 1}. ${server.name}`))
          console.log(`   ${chalk.dim(server.description)}`)
          console.log(`   ${chalk.yellow('Slug:')} ${server.slug} | ${chalk.yellow('Installs:')} ${server.installs.toLocaleString()} | ${chalk.yellow('By:')} ${server.author}`)
          console.log(`   ${chalk.green('Tools:')} ${server.tools.join(', ')}`)
          console.log(`   ${chalk.blue('Connect:')} ${chalk.dim(`mcphosting connect ${server.slug}`)}`)
          console.log('')
        })

        if (results.length > limit) {
          Logger.dim(`Showing ${limit} of ${results.length}. Use --limit for more.`)
        }
      } catch (error: any) {
        spinner.fail('Search failed')
        Logger.error(error.message)
        process.exit(1)
      }
    })
}

export function createInfoCommand(): Command {
  return new Command('info')
    .description('Show detailed information about an MCP server')
    .argument('<slug>', 'MCP server slug')
    .option('--json', 'Output as JSON')
    .action(async (slug: string, options) => {
      const config = new Config()
      const api = new MCPHostingAPI(config.token)
      const spinner = Logger.spinner(`Getting info for ${slug}...`)

      try {
        const server = await api.getMCPInfo(slug)

        if (!server) {
          spinner.fail(`Not found: ${slug}`)
          Logger.info(`Use ${chalk.cyan('mcphosting search <query>')} to find servers`)
          return
        }

        spinner.stop()

        if (options.json) {
          Logger.json(server)
          return
        }

        console.log('')
        console.log(chalk.bold.cyan(`📦 ${server.name}`))
        console.log(chalk.dim(server.description))
        console.log('')

        const info = [
          { Property: 'Slug', Value: server.slug },
          { Property: 'Author', Value: server.author },
          { Property: 'Installs', Value: server.installs.toLocaleString() },
          { Property: 'Tools', Value: server.tools.length.toString() },
        ]
        if (server.url) {
          info.push({ Property: 'URL', Value: server.url })
        }

        Logger.table(info)

        console.log('')
        console.log(chalk.yellow('🔧 Available Tools:'))
        server.tools.forEach(tool => console.log(`  • ${tool}`))

        console.log('')
        console.log(chalk.green('💡 Quick Start:'))
        console.log(chalk.dim(`  mcphosting connect ${server.slug}`))

        const connection = config.findConnection(slug)
        if (connection) {
          console.log('')
          console.log(chalk.blue('ℹ️  Already connected to:'), connection.clients.join(', '))
        }

        console.log('')
      } catch (error: any) {
        spinner.fail('Failed to get info')
        Logger.error(error.message)
        process.exit(1)
      }
    })
}
