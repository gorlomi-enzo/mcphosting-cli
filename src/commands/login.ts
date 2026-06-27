import { Command } from 'commander'
import { createServer } from 'http'
import open from 'open'
import { Config } from '../lib/config.js'
import { MCPHostingAPI } from '../lib/api.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'
import * as readline from 'readline'

function prompt(question: string, hidden: boolean = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    if (hidden) {
      // For password input, mute output
      const originalWrite = process.stdout.write.bind(process.stdout)
      process.stdout.write = ((str: string | Uint8Array) => {
        if (typeof str === 'string' && str !== question && str !== '\n' && str !== '\r\n') {
          return originalWrite('*')
        }
        return originalWrite(str)
      }) as typeof process.stdout.write

      rl.question(question, (answer) => {
        process.stdout.write = originalWrite
        console.log() // New line after hidden input
        rl.close()
        resolve(answer)
      })
    } else {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer)
      })
    }
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loginWithGitHub(config: Config): Promise<void> {
  const api = new MCPHostingAPI()
  const spinner = Logger.spinner('Starting GitHub login...')

  try {
    // Step 1: Start device flow
    const deviceFlow = await api.githubDeviceStart()
    spinner.stop()

    // Step 2: Show the code to the user
    console.log('')
    console.log(chalk.bold('  🔐 GitHub Login'))
    console.log('')
    console.log(`  ${chalk.dim('1.')} Open ${chalk.cyan.underline(deviceFlow.verification_uri)}`)
    console.log(`  ${chalk.dim('2.')} Enter code: ${chalk.bold.yellow(deviceFlow.user_code)}`)
    console.log('')

    // Try to open browser automatically
    try {
      await open(deviceFlow.verification_uri)
      Logger.dim('  Browser opened automatically.')
    } catch {
      Logger.dim('  Open the URL above in your browser.')
    }

    console.log('')
    const pollSpinner = Logger.spinner('Waiting for GitHub authorization...')

    // Step 3: Poll for completion
    const pollInterval = (deviceFlow.interval || 5) * 1000
    const maxAttempts = Math.ceil((deviceFlow.expires_in || 900) / (deviceFlow.interval || 5))
    let currentInterval = pollInterval

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(currentInterval)

      const result = await api.githubDevicePoll(deviceFlow.device_code)

      if (result.token && result.user) {
        // Success!
        config.token = result.token
        config.refreshToken = result.refresh_token
        config.user = { email: result.user.email, org: result.user.github_username }

        pollSpinner.succeed(
          result.is_new_user
            ? `Account created and logged in as ${chalk.bold(result.user.github_username || result.user.email)}`
            : `Logged in as ${chalk.bold(result.user.github_username || result.user.email)}`
        )

        console.log('')
        Logger.info(`Token stored in ${chalk.dim('~/.config/mcphosting/')}`)
        Logger.info(`Run ${chalk.cyan('mcphosting deploy')} to deploy your first MCP server!`)
        return
      }

      if (result.error === 'authorization_pending') {
        continue // Still waiting
      }

      if (result.error === 'slow_down') {
        // GitHub wants us to slow down
        currentInterval = (result.interval || 10) * 1000
        continue
      }

      // Any other error
      pollSpinner.fail('GitHub login failed')
      Logger.error(result.error || 'Unknown error during GitHub authorization')
      process.exit(1)
    }

    pollSpinner.fail('GitHub login timed out')
    Logger.error('Authorization expired. Please try again.')
    process.exit(1)
  } catch (error: any) {
    spinner.fail('GitHub login failed')
    Logger.error(error.message || 'Failed to start GitHub device flow')
    process.exit(1)
  }
}

export function createLoginCommand(): Command {
  return new Command('login')
    .description('Authenticate with MCPHosting')
    .option('--email <email>', 'Email address')
    .option('--token <token>', 'Provide API token directly')
    .option('--github', 'Login with GitHub (recommended)')
    .option('--browser', 'Use browser-based login')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const config = new Config()
      const isJson = options.json || Logger.isJsonMode

      // Check env var auth first
      if (process.env.MCPHOSTING_TOKEN && !options.token && !options.github && !options.email) {
        const api = new MCPHostingAPI(process.env.MCPHOSTING_TOKEN)
        const user = await api.whoami()
        if (isJson) {
          console.log(JSON.stringify({
            success: true,
            email: user?.email || 'unknown',
            token_source: 'environment',
          }))
        } else {
          Logger.success(`Authenticated via MCPHOSTING_TOKEN env var`)
          if (user) Logger.info(`  User: ${chalk.bold(user.email)}`)
        }
        return
      }

      // GitHub OAuth login (recommended)
      if (options.github) {
        await loginWithGitHub(config)
        return
      }

      // Direct token auth
      if (options.token) {
        config.token = options.token
        const api = new MCPHostingAPI(options.token)
        const user = await api.whoami()

        if (user) {
          config.user = user
          if (isJson) {
            console.log(JSON.stringify({ success: true, email: user.email }))
          } else {
            Logger.success(`Logged in as ${chalk.bold(user.email)}`)
          }
        } else {
          if (isJson) {
            console.log(JSON.stringify({ success: true, warning: 'Token saved but could not verify identity' }))
          } else {
            Logger.warning('Token saved, but could not verify identity.')
          }
        }
        return
      }

      // Non-TTY without explicit auth method: error gracefully
      if (!process.stdin.isTTY && !options.email) {
        if (isJson) {
          console.log(JSON.stringify({
            success: false,
            error: 'Interactive login requires a TTY. Use --token or MCPHOSTING_TOKEN env var for scripted usage.',
          }))
        } else {
          Logger.error('Interactive login requires a TTY.')
          Logger.info('Use one of:')
          Logger.dim(`  ${chalk.cyan('mcphosting login --token <token>')}`)
          Logger.dim(`  ${chalk.cyan('export MCPHOSTING_TOKEN=<token>')}`)
        }
        process.exit(1)
      }

      // Email/password login
      if (options.email || !process.stdout.isTTY) {
        const email = options.email || await prompt(chalk.cyan('Email: '))
        const password = await prompt(chalk.cyan('Password: '), true)

        if (!email || !password) {
          Logger.error('Email and password are required.')
          process.exit(1)
        }

        const spinner = Logger.spinner('Logging in...')

        try {
          const api = new MCPHostingAPI()
          const result = await api.login(email, password)

          config.token = result.token
          config.refreshToken = result.refresh_token
          config.user = result.user

          spinner.succeed(`Logged in as ${chalk.bold(result.user.email)}`)
          console.log('')
          Logger.info(`Token stored in ${chalk.dim('~/.config/mcphosting/')}`)
          Logger.info(`Run ${chalk.cyan('mcphosting deploy')} to deploy your first MCP server!`)
        } catch (error: any) {
          spinner.fail('Login failed')
          Logger.error(error.message || 'Invalid email or password.')
          process.exit(1)
        }
        return
      }

      // Interactive: show login options for TTY
      if (process.stdout.isTTY) {
        console.log('')
        console.log(chalk.bold('  🚀 MCPHosting Login'))
        console.log('')
        console.log(`  ${chalk.cyan('mcphosting login --github')}     ${chalk.dim('Login with GitHub (recommended)')}`)
        console.log(`  ${chalk.cyan('mcphosting login --email')}      ${chalk.dim('Login with email/password')}`)
        console.log(`  ${chalk.cyan('mcphosting login --browser')}    ${chalk.dim('Login via browser')}`)
        console.log(`  ${chalk.cyan('mcphosting login --token')}      ${chalk.dim('Use existing API token')}`)
        console.log('')

        // Default to GitHub login
        Logger.info('Starting GitHub login (use --email for email/password)...')
        console.log('')
        await loginWithGitHub(config)
        return
      }

      // Browser-based OAuth flow (fallback)
      const spinner = Logger.spinner('Opening browser for login...')
      let server: any

      try {
        const authPromise = new Promise<string>((resolve, reject) => {
          server = createServer((req, res) => {
            if (req.url?.startsWith('/callback')) {
              const url = new URL(req.url, 'http://localhost')
              const token = url.searchParams.get('token')

              if (token) {
                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.end(`
                  <html>
                    <body style="font-family: system-ui; text-align: center; padding: 50px; background: #0a0a0a; color: #fff;">
                      <h2>✅ Login Successful!</h2>
                      <p style="color: #888;">You can close this window and return to your terminal.</p>
                    </body>
                  </html>
                `)
                resolve(token)
              } else {
                res.writeHead(400, { 'Content-Type': 'text/html' })
                res.end(`
                  <html>
                    <body style="font-family: system-ui; text-align: center; padding: 50px; background: #0a0a0a; color: #fff;">
                      <h2>❌ Login Failed</h2>
                      <p style="color: #888;">No token received. Please try again.</p>
                    </body>
                  </html>
                `)
                reject(new Error('No token received'))
              }
            } else {
              res.writeHead(404)
              res.end('Not found')
            }
          })

          server.listen(0, () => {
            const port = (server.address() as any).port
            const callbackUrl = `http://localhost:${port}/callback`
            const authUrl = `https://mcphosting.com/cli/auth?callback=${encodeURIComponent(callbackUrl)}`

            spinner.text = 'Waiting for browser login...'

            setTimeout(() => {
              reject(new Error('Login timed out after 2 minutes. Try again.'))
            }, 120000)

            open(authUrl).catch(() => {
              spinner.info('Could not open browser automatically.')
              Logger.info(`Open this URL manually: ${chalk.blue(authUrl)}`)
            })
          })
        })

        const token = await authPromise
        spinner.succeed('Login successful!')

        config.token = token
        const api = new MCPHostingAPI(token)
        const user = await api.whoami()

        if (user) {
          config.user = user
          Logger.success(`Logged in as ${chalk.bold(user.email)}`)
        }

        console.log('')
        Logger.info(`Run ${chalk.cyan('mcphosting deploy')} to deploy your first MCP server!`)

      } catch (error: any) {
        spinner.fail('Login failed')
        Logger.error(error.message)

        console.log('')
        Logger.info(`Alternative: ${chalk.cyan('mcphosting login --github')}`)
        process.exit(1)
      } finally {
        if (server) {
          server.close()
        }
      }
    })
}
