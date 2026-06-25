# MCPHosting CLI

[![npm version](https://badge.fury.io/js/mcphosting-cli.svg)](https://www.npmjs.com/package/mcphosting-cli)
[![Downloads](https://img.shields.io/npm/dm/mcphosting-cli.svg)](https://www.npmjs.com/package/mcphosting-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Deploy MCP servers in 30 seconds.** The easiest way to host, connect, and manage Model Context Protocol servers.

## ⚡ Quick Start

```bash
npm install -g mcphosting-cli

mcphosting login --github    # Login with GitHub (recommended)
mcphosting deploy
# Done. Your MCP server is live. 🚀
```

That's it. Three commands. Your MCP server is deployed and ready for Claude Desktop, Cursor, ChatGPT, and more.

## 🚀 Deploy

### Deploy from current directory

```bash
cd my-mcp-server
mcphosting deploy
```

Auto-detects your MCP server (looks for `@modelcontextprotocol/sdk` in package.json) and deploys it.

### Deploy from GitHub

```bash
mcphosting deploy --github https://github.com/user/my-mcp-server
```

### Deploy with options

```bash
mcphosting deploy --name "My MCP" --auth api_key
mcphosting deploy --api-url https://my-existing-mcp.com/api
```

## 🔗 Connect

Connect any MCP server to your AI clients with one command:

```bash
mcphosting connect github           # Connect GitHub MCP
mcphosting connect notion           # Connect Notion MCP
mcphosting connect https://my.mcp   # Connect custom server

# Target specific client
mcphosting connect slack --client claude
mcphosting connect stripe --client cursor
```

Auto-detects Claude Desktop, Cursor, VS Code, and OpenClaw — configures all of them at once.

## 📦 All Commands

### Authentication

```bash
mcphosting login                    # GitHub login (default, recommended)
mcphosting login --github           # Explicit GitHub login
mcphosting login --email me@x.com   # Email/password login
mcphosting login --token <token>    # Direct token auth
mcphosting login --browser          # Browser-based login
mcphosting logout                   # Log out
mcphosting whoami                   # Show current user
```

### Deployment & Management

```bash
mcphosting deploy                   # Deploy current directory
mcphosting deploy --github <url>    # Deploy from GitHub
mcphosting list                     # List all servers
mcphosting status <slug>            # Check server status
mcphosting logs <slug>              # View server logs
mcphosting logs <slug> -n 100       # Last 100 log lines
```

### Environment Variables

```bash
mcphosting env list <slug>          # List env vars
mcphosting env set <slug> KEY=val   # Set an env var
mcphosting env remove <slug> KEY    # Remove an env var
```

### API Keys

```bash
mcphosting keys list                # List API keys
mcphosting keys create "Prod Key"   # Create new key
mcphosting keys delete <id>         # Delete a key
```

### Marketplace

```bash
mcphosting search github            # Search marketplace
mcphosting info notion              # Server details
mcphosting connect <slug>           # Install to AI clients
```

### Connection Management

```bash
mcphosting connect <url-or-slug>    # Connect MCP to AI clients
mcphosting disconnect <slug>        # Remove connection
mcphosting list --local             # Show local connections
```

### Migration

```bash
mcphosting import --from smithery   # Import from Smithery
```

## 🎯 Supported AI Clients

| Client | Auto-Config | Location |
|--------|:-----------:|----------|
| Claude Desktop | ✅ | `~/Library/Application Support/Claude/` |
| Cursor | ✅ | `~/.cursor/mcp.json` |
| VS Code | ✅ | `.vscode/mcp.json` |
| OpenClaw | ✅ | `~/.openclaw/mcp.json` |
| ChatGPT | 📋 | Web setup instructions |

## 🏗️ How It Works

1. **`mcphosting login`** — Authenticates with MCPHosting.com
2. **`mcphosting deploy`** — Detects your MCP server, deploys to cloud
3. **`mcphosting connect`** — Configures your AI clients to use the server
4. **Proxy mode** — `npx mcphosting-cli proxy <url>` bridges STDIO ↔ HTTP

Your deployed server gets a URL like `https://your-server.mcphost.dev` that works with any MCP client.

## 🔒 Security

- Credentials stored locally in `~/.config/mcphosting/`
- No data collection during proxy
- Open source — audit the code
- Optional auth — marketplace browsing works without login

## 📚 Links

- [Documentation](https://mcphosting.com/docs)
- [Dashboard](https://mcphosting.com/dashboard)
- [GitHub](https://github.com/gorlomi-enzo/mcphosting-cli)

## License

MIT
