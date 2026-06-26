import { Command } from 'commander'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

const BASH_COMPLETIONS = `
# mcphosting bash completions
_mcphosting_completions() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local prev="\${COMP_WORDS[COMP_CWORD-1]}"
  local commands="login logout deploy init connect disconnect list status logs env keys search info import proxy whoami account completions"
  local templates="weather crypto notion postgres blank runescape reminder search"
  local global_opts="--help --version --json --silent"

  case "\${prev}" in
    mcphosting|mcphost)
      COMPREPLY=( $(compgen -W "\${commands} \${global_opts}" -- "\${cur}") )
      return 0
      ;;
    deploy)
      COMPREPLY=( $(compgen -W "--template --github --api-url --name --auth --json --silent --configure --no-auto-key" -- "\${cur}") )
      return 0
      ;;
    --template)
      COMPREPLY=( $(compgen -W "\${templates}" -- "\${cur}") )
      return 0
      ;;
    --auth)
      COMPREPLY=( $(compgen -W "none api_key oauth" -- "\${cur}") )
      return 0
      ;;
    --shell)
      COMPREPLY=( $(compgen -W "bash zsh fish" -- "\${cur}") )
      return 0
      ;;
    env)
      COMPREPLY=( $(compgen -W "list set remove" -- "\${cur}") )
      return 0
      ;;
    keys)
      COMPREPLY=( $(compgen -W "list create delete" -- "\${cur}") )
      return 0
      ;;
    login)
      COMPREPLY=( $(compgen -W "--github --email --token --browser --json" -- "\${cur}") )
      return 0
      ;;
    list)
      COMPREPLY=( $(compgen -W "--local --remote --json" -- "\${cur}") )
      return 0
      ;;
    status|logs)
      COMPREPLY=( $(compgen -W "--json" -- "\${cur}") )
      return 0
      ;;
    *)
      COMPREPLY=( $(compgen -W "\${global_opts}" -- "\${cur}") )
      return 0
      ;;
  esac
}
complete -F _mcphosting_completions mcphosting
complete -F _mcphosting_completions mcphost
`.trim()

const ZSH_COMPLETIONS = `
#compdef mcphosting mcphost

_mcphosting() {
  local -a commands templates global_opts

  commands=(
    'login:Authenticate with MCPHosting'
    'logout:Log out and remove stored credentials'
    'deploy:Deploy an MCP server to MCPHosting'
    'init:Initialize mcphosting.json in the current directory'
    'connect:Connect an MCP server to your AI clients'
    'disconnect:Disconnect an MCP server'
    'list:List your MCP servers'
    'status:Check the status of a deployed MCP server'
    'logs:View logs for a deployed MCP server'
    'env:Manage environment variables'
    'keys:Manage API keys'
    'search:Search MCP servers in the marketplace'
    'info:Show detailed information about an MCP server'
    'import:Import MCP connections from other tools'
    'proxy:Start a local STDIO MCP proxy'
    'whoami:Show current logged-in user'
    'account:Show MCPHosting account status'
    'completions:Generate shell completions'
  )

  templates=(weather crypto notion postgres blank runescape reminder search)
  global_opts=(--help --version --json --silent)

  _arguments -C \\
    '1:command:->cmd' \\
    '*::arg:->args'

  case "\$state" in
    cmd)
      _describe -t commands 'mcphosting commands' commands
      _values 'global options' \$global_opts
      ;;
    args)
      case "\$words[1]" in
        deploy)
          _arguments \\
            '--template[Deploy from template]:template:(weather crypto notion postgres blank runescape reminder search)' \\
            '--github[Deploy from GitHub URL]:url:' \\
            '--api-url[External server URL]:url:' \\
            '--name[Server name]:name:' \\
            '--auth[Auth type]:auth:(none api_key oauth)' \\
            '--json[Output as JSON]' \\
            '--silent[Suppress interactive output]' \\
            '--configure[Auto-configure AI clients]' \\
            '--no-auto-key[Skip API key creation]'
          ;;
        completions)
          _arguments '--shell[Shell type]:shell:(bash zsh fish)'
          ;;
        login)
          _arguments '--github' '--email:email:' '--token:token:' '--browser' '--json'
          ;;
        *)
          _arguments '--json[Output as JSON]'
          ;;
      esac
      ;;
  esac
}

_mcphosting "\$@"
`.trim()

const FISH_COMPLETIONS = `
# mcphosting fish completions
set -l commands login logout deploy init connect disconnect list status logs env keys search info import proxy whoami account completions
set -l templates weather crypto notion postgres blank runescape reminder search

complete -c mcphosting -f
complete -c mcphost -f

# Commands
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a login -d "Authenticate with MCPHosting"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a logout -d "Log out"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a deploy -d "Deploy an MCP server"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a init -d "Initialize mcphosting.json"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a connect -d "Connect MCP to AI clients"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a disconnect -d "Disconnect MCP server"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a list -d "List servers"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a status -d "Check server status"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a logs -d "View logs"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a env -d "Manage env vars"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a keys -d "Manage API keys"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a search -d "Search marketplace"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a info -d "MCP server info"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a import -d "Import connections"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a proxy -d "STDIO proxy"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a whoami -d "Show current user"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a account -d "Account status"
complete -c mcphosting -n "not __fish_seen_subcommand_from $commands" -a completions -d "Generate completions"

# Global
complete -c mcphosting -l json -d "Output as JSON"
complete -c mcphosting -l silent -d "Suppress interactive output"
complete -c mcphosting -l help -d "Show help"
complete -c mcphosting -l version -d "Show version"

# Deploy options
complete -c mcphosting -n "__fish_seen_subcommand_from deploy" -l template -xa "$templates" -d "Template name"
complete -c mcphosting -n "__fish_seen_subcommand_from deploy" -l github -d "GitHub URL"
complete -c mcphosting -n "__fish_seen_subcommand_from deploy" -l api-url -d "API URL"
complete -c mcphosting -n "__fish_seen_subcommand_from deploy" -l name -d "Server name"
complete -c mcphosting -n "__fish_seen_subcommand_from deploy" -l auth -xa "none api_key oauth" -d "Auth type"
complete -c mcphosting -n "__fish_seen_subcommand_from deploy" -l configure -d "Auto-configure clients"

# Completions options
complete -c mcphosting -n "__fish_seen_subcommand_from completions" -l shell -xa "bash zsh fish" -d "Shell type"
`.trim()

export function createCompletionsCommand(): Command {
  return new Command('completions')
    .description('Generate shell completions (bash, zsh, fish)')
    .option('--shell <shell>', 'Shell type: bash, zsh, or fish')
    .action((options) => {
      const shell = options.shell?.toLowerCase() || detectShell()

      switch (shell) {
        case 'bash':
          console.log(BASH_COMPLETIONS)
          if (!options.shell) {
            console.error('')
            console.error(chalk.dim('# Add to ~/.bashrc:'))
            console.error(chalk.cyan('#   mcphosting completions --shell=bash >> ~/.bashrc'))
          }
          break
        case 'zsh':
          console.log(ZSH_COMPLETIONS)
          if (!options.shell) {
            console.error('')
            console.error(chalk.dim('# Save to a file in your fpath:'))
            console.error(chalk.cyan('#   mcphosting completions --shell=zsh > ~/.zfunc/_mcphosting'))
          }
          break
        case 'fish':
          console.log(FISH_COMPLETIONS)
          if (!options.shell) {
            console.error('')
            console.error(chalk.dim('# Save to completions dir:'))
            console.error(chalk.cyan('#   mcphosting completions --shell=fish > ~/.config/fish/completions/mcphosting.fish'))
          }
          break
        default:
          Logger.error(`Unknown shell: ${shell}`)
          Logger.info('Supported shells: bash, zsh, fish')
          Logger.info('Usage: mcphosting completions --shell=bash')
          process.exit(1)
      }
    })
}

function detectShell(): string {
  const shell = process.env.SHELL || ''
  if (shell.includes('zsh')) return 'zsh'
  if (shell.includes('fish')) return 'fish'
  return 'bash'
}
