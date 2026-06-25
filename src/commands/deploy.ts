import { Command } from 'commander'
import { getAuthenticatedAPI } from '../lib/auth.js'
import { detectMCP } from '../lib/detector.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

export function createDeployCommand(): Command {
  return new Command('deploy')
    .description('Deploy an MCP server to MCPHosting')
    .option('--github <url>', 'Deploy from a GitHub repository URL')
    .option('--name <name>', 'Server name (auto-detected if not provided)')
    .option('--api-url <url>', 'Your MCP server\'s API URL (for external servers)')
    .option('--auth <type>', 'Auth type: none, api_key, or oauth', 'none')
    .action(async (options) => {
      const { api } = getAuthenticatedAPI()

      console.log('')
      console.log(chalk.bold('🚀 MCPHosting Deploy'))
      console.log('')

      // --- GitHub Deploy ---
      if (options.github) {
        const githubUrl = options.github
        const spinner = Logger.spinner(`Deploying from ${chalk.cyan(githubUrl)}...`)

        try {
          const result = await api.deploy({
            name: options.name || extractRepoName(githubUrl),
            githubUrl,
            authType: options.auth,
          })

          spinner.succeed('Deployed successfully!')
          printDeployResult(result, options.name || extractRepoName(githubUrl))
        } catch (error: any) {
          spinner.fail('Deploy failed')
          Logger.error(error.message)
          process.exit(1)
        }
        return
      }

      // --- API URL Deploy (external server registration) ---
      if (options.apiUrl) {
        const name = options.name || new URL(options.apiUrl).hostname
        const spinner = Logger.spinner(`Registering ${chalk.cyan(name)}...`)

        try {
          const result = await api.deploy({
            name,
            baseApiUrl: options.apiUrl,
            authType: options.auth,
          })

          spinner.succeed('Registered successfully!')
          printDeployResult(result, name)
        } catch (error: any) {
          spinner.fail('Registration failed')
          Logger.error(error.message)
          process.exit(1)
        }
        return
      }

      // --- Auto-detect from current directory ---
      const dir = process.cwd()
      const spinner = Logger.spinner('Detecting MCP server in current directory...')

      const detected = await detectMCP(dir)

      if (!detected) {
        spinner.fail('No MCP server detected in current directory')
        console.log('')
        Logger.info('This directory doesn\'t look like an MCP server project.')
        Logger.info('Expected: package.json with @modelcontextprotocol/sdk dependency')
        console.log('')
        Logger.info(chalk.bold('Options:'))
        Logger.info(`  ${chalk.cyan('mcphosting deploy --github <url>')}    Deploy from GitHub`)
        Logger.info(`  ${chalk.cyan('mcphosting deploy --api-url <url>')}   Register an external MCP server`)
        console.log('')
        Logger.info(`Need help? ${chalk.blue('https://mcphosting.com/docs/deploy')}`)
        process.exit(1)
      }

      spinner.succeed(`Detected: ${chalk.bold(detected.name)} (${detected.runtime})`)

      // Show what was detected
      Logger.info(`  SDK: ${detected.hasMcpSdk ? chalk.green('✓') : chalk.yellow('○')} @modelcontextprotocol/sdk`)
      if (detected.configFiles.length > 0) {
        Logger.info(`  Config: ${detected.configFiles.join(', ')}`)
      }
      if (detected.entryPoint) {
        Logger.info(`  Entry: ${detected.entryPoint}`)
      }
      console.log('')

      // Check if this is a git repo with a remote (prefer GitHub deploy)
      let githubUrl: string | null = null
      try {
        const { execSync } = await import('child_process')
        const remoteUrl = execSync('git remote get-url origin', { cwd: dir, encoding: 'utf-8' }).trim()
        if (remoteUrl.includes('github.com')) {
          githubUrl = remoteUrl
            .replace(/^git@github\.com:/, 'https://github.com/')
            .replace(/\.git$/, '')
        }
      } catch {
        // Not a git repo or no remote
      }

      const name = options.name || detected.name
      const deploySpinner = Logger.spinner(`Deploying ${chalk.bold(name)}...`)

      try {
        const result = await api.deploy({
          name,
          githubUrl: githubUrl || undefined,
          authType: options.auth,
        })

        deploySpinner.succeed('Deployed successfully!')
        printDeployResult(result, name)
      } catch (error: any) {
        deploySpinner.fail('Deploy failed')
        Logger.error(error.message)

        if (error.message.includes('Authentication')) {
          Logger.info(`Run ${chalk.cyan('mcphosting login')} first.`)
        }
        process.exit(1)
      }
    })
}

function extractRepoName(url: string): string {
  const parts = url.replace(/\.git$/, '').split('/')
  return parts[parts.length - 1] || 'mcp-server'
}

function printDeployResult(result: any, name: string) {
  console.log('')
  console.log(chalk.green.bold('  ✅ Your MCP server is live!'))
  console.log('')

  if (result.url) {
    Logger.info(`  URL:  ${chalk.blue(result.url)}`)
  }
  if (result.sseUrl) {
    Logger.info(`  SSE:  ${chalk.blue(result.sseUrl)}`)
  }
  if (result.streamableUrl) {
    Logger.info(`  Streamable HTTP: ${chalk.blue(result.streamableUrl)}`)
  }
  if (result.slug) {
    Logger.info(`  Slug: ${chalk.cyan(result.slug)}`)
  }

  console.log('')
  console.log(chalk.bold('  📋 Add to your AI client:'))
  console.log('')

  const serverUrl = result.sseUrl || result.streamableUrl || result.url
  if (serverUrl) {
    // Claude Desktop config
    console.log(chalk.dim('  Claude Desktop (claude_desktop_config.json):'))
    console.log(chalk.dim('  ─────────────────────────────────────────────'))
    console.log(chalk.white(`  {`))
    console.log(chalk.white(`    "mcpServers": {`))
    console.log(chalk.white(`      "${result.slug || name}": {`))
    console.log(chalk.white(`        "command": "npx",`))
    console.log(chalk.white(`        "args": ["-y", "mcphosting-cli", "proxy", "${serverUrl}"],`))
    console.log(chalk.white(`        "env": {}`))
    console.log(chalk.white(`      }`))
    console.log(chalk.white(`    }`))
    console.log(chalk.white(`  }`))
    console.log('')

    // Quick connect
    console.log(chalk.dim('  Or connect instantly:'))
    console.log(chalk.cyan(`  mcphosting connect ${result.slug || name}`))
  }

  console.log('')
  Logger.info(`Manage at ${chalk.blue('https://mcphosting.com/dashboard')}`)
  console.log('')
}
