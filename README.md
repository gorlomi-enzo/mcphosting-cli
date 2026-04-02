# MCPHosting CLI

[![npm version](https://badge.fury.io/js/@mcphosting%2Fcli.svg)](https://www.npmjs.com/package/@mcphosting/cli)
[![Downloads](https://img.shields.io/npm/dm/@mcphosting/cli.svg)](https://www.npmjs.com/package/@mcphosting/cli)
[![GitHub stars](https://img.shields.io/github/stars/gorlomi-enzo/mcphosting-cli.svg)](https://github.com/gorlomi-enzo/mcphosting-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Connect AI agents to MCP servers. Browse, install, and manage Model Context Protocol servers.**

The easiest way to connect MCP servers to Claude Desktop, ChatGPT, Cursor, VS Code, and other AI clients. One command to rule them all.

## ⚡ Quick Start

```bash
# Install globally
npm install -g @mcphosting/cli

# Or run directly with npx
npx @mcphosting/cli connect github
```

## 🔗 How to Connect MCP Servers to AI Clients

### How to Connect MCP Servers to Claude Desktop

Claude Desktop is the most popular way to use MCP servers. Here's how to connect any MCP server:

1. **Install the CLI:**
   ```bash
   npm install -g @mcphosting/cli
   ```

2. **Connect an MCP server:**
   ```bash
   mcphost connect github
   ```

3. **Restart Claude Desktop** to load the new MCP server

The CLI automatically detects your Claude Desktop installation and updates the `claude_desktop_config.json` file with the MCP server configuration.

**Manual Claude Desktop Setup:**
If you prefer manual setup, edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@mcphosting/cli", "proxy", "https://github.mcphost.dev"],
      "env": {}
    }
  }
}
```

### How to Connect MCP Servers to ChatGPT

ChatGPT Plus users can connect MCP servers through the web interface:

1. **Get the MCP server URL:**
   ```bash
   mcphost info github  # Shows the server URL
   ```

2. **Add to ChatGPT:**
   - Open ChatGPT in your browser
   - Go to Settings → Apps → Connect an app
   - Enter the MCP server URL (e.g., `https://github.mcphost.dev`)
   - Follow the authorization prompts

3. **Start using MCP tools** in your ChatGPT conversations

### How to Connect MCP Servers to Cursor

Cursor IDE supports MCP servers through configuration files:

1. **Auto-connect with CLI:**
   ```bash
   mcphost connect notion --client cursor
   ```

2. **Manual Cursor setup:**
   Create or edit `~/.cursor/mcp.json`:
   ```json
   {
     "mcpServers": {
       "notion": {
         "command": "npx",
         "args": ["-y", "@mcphosting/cli", "proxy", "https://notion.mcphost.dev"],
         "env": {}
       }
     }
   }
   ```

3. **Restart Cursor** to load the MCP server

## 📦 Available Commands

### Connection Management
```bash
mcphost connect <url-or-slug>           # Connect MCP server to all AI clients
mcphost connect <url> --client claude   # Connect only to Claude Desktop
mcphost disconnect <slug>               # Remove MCP connection
mcphost list                           # List all connected MCP servers
```

### Marketplace
```bash
mcphost search <query>                 # Search MCP marketplace
mcphost info <slug>                    # Get detailed MCP server info
```

### Migration
```bash
mcphost import --from smithery         # Import from Smithery CLI
```

### Authentication (Optional)
```bash
mcphost login                          # Login to MCPHosting
mcphost logout                         # Logout
mcphost whoami                         # Show current user
```

## 🌟 Featured MCP Servers

| Server | Description | Tools | Connect |
|--------|-------------|-------|---------|
| **GitHub** | Access repositories, issues, PRs | `read_file`, `list_repos`, `create_issue` | `mcphost connect github` |
| **Slack** | Send messages, manage workspaces | `send_message`, `list_channels` | `mcphost connect slack` |
| **Notion** | Read/write pages and databases | `read_page`, `create_page`, `query_database` | `mcphost connect notion` |
| **Stripe** | Payment and customer data | `get_customer`, `list_payments` | `mcphost connect stripe` |
| **PostgreSQL** | Safe database queries | `query`, `describe_table`, `list_tables` | `mcphost connect postgres` |

## 🚀 MCPHosting CLI vs Smithery CLI

| Feature | MCPHosting CLI | Smithery CLI |
|---------|----------------|--------------|
| **Auto-detection** | ✅ Detects Claude, Cursor, VS Code | ❌ Manual config |
| **ChatGPT support** | ✅ Web setup instructions | ❌ Not supported |
| **Migration** | ✅ `import --from smithery` | ❌ No migration |
| **Marketplace** | ✅ Search & browse built-in | ❌ Limited discovery |
| **Growth features** | ✅ Sharing prompts, GitHub stars | ❌ Basic CLI |
| **Proxy mode** | ✅ Built-in STDIO proxy | ❌ External tools needed |
| **Multiple clients** | ✅ Connect to all at once | ❌ One at a time |

**Migration from Smithery:**
```bash
mcphost import --from smithery
```

## 🎯 Supported AI Clients

| Client | Status | Auto-Detection | Config Location |
|--------|--------|----------------|-----------------|
| **Claude Desktop** | ✅ Full support | ✅ Automatic | `~/Library/Application Support/Claude/` |
| **ChatGPT Plus** | ✅ Web setup | N/A | Web interface |
| **Cursor** | ✅ Full support | ✅ Automatic | `~/.cursor/mcp.json` |
| **VS Code** | ✅ Full support | ✅ Automatic | `.vscode/mcp.json` |
| **OpenClaw** | ✅ Full support | ✅ Automatic | `~/.openclaw/mcp.json` |

## 🔧 Examples

**Connect GitHub MCP to all clients:**
```bash
mcphost connect github
# 🎉 Connected! Share with your team:
# npx @mcphosting/cli connect github
# 
# ⭐ Star us: https://github.com/gorlomi-enzo/mcphosting-cli
```

**Connect custom MCP server:**
```bash
mcphost connect https://my-custom-mcp.example.com
```

**Search for MCP servers:**
```bash
mcphost search "database"
mcphost search "slack"
mcphost info notion
```

**Import from Smithery:**
```bash
mcphost import --from smithery --dry-run  # Preview what will be imported
mcphost import --from smithery            # Actually import
```

**List connections:**
```bash
mcphost list
# 📋 Connected MCP Servers (3)
# 
# Slug    | URL                          | Clients           | Added
# github  | https://github.mcphost.dev   | claude, cursor    | 12/1/2024
# slack   | https://slack.mcphost.dev    | claude            | 12/1/2024
# notion  | https://notion.mcphost.dev   | claude, cursor    | 12/1/2024
```

## 🏗️ How It Works

1. **URL Resolution:** Slugs like `github` become `https://github.mcphost.dev`
2. **Client Detection:** Automatically finds Claude Desktop, Cursor, VS Code configs
3. **Config Update:** Adds MCP server entry to each client's config file
4. **Proxy Mode:** Uses `npx @mcphosting/cli proxy <url>` for STDIO communication

**Config Format:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@mcphosting/cli", "proxy", "https://github.mcphost.dev"],
      "env": {}
    }
  }
}
```

## 🔒 Security & Privacy

- **No data collection** during MCP proxying
- **Open source** - audit the code yourself
- **Local config** - your connections stored in `~/.mcphosting/`
- **Optional auth** - marketplace features only

## 📚 Documentation

- [Getting Started Guide](https://mcphosting.com/docs/getting-started)
- [MCP Server Development](https://mcphosting.com/docs/development)
- [API Reference](https://mcphosting.com/docs/api)
- [Troubleshooting](https://mcphosting.com/docs/troubleshooting)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin my-feature`
5. Submit a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=gorlomi-enzo/mcphosting-cli&type=Date)](https://star-history.com/#gorlomi-enzo/mcphosting-cli&Date)

---

**Made with ❤️ by [MCPHosting](https://mcphosting.com)**

[⭐ Star us on GitHub](https://github.com/gorlomi-enzo/mcphosting-cli) • [🐦 Follow on Twitter](https://twitter.com/mcphosting) • [💬 Join Discord](https://discord.gg/mcphosting)