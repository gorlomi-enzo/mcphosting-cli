# Contributing to MCPHosting CLI

We welcome contributions from the community! Whether you're fixing a bug, adding a feature, or improving documentation, your help is appreciated.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/mcphosting-cli.git
   cd mcphosting-cli
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Build the project:**
   ```bash
   npm run build
   ```
5. **Test your changes:**
   ```bash
   npm test
   node dist/index.js --help
   ```

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- TypeScript

### Project Structure
```
mcphosting-cli/
├── src/           # TypeScript source code
├── dist/          # Compiled JavaScript (generated)
├── assets/        # Documentation assets
├── tests/         # Test files
└── README.md      # Main documentation
```

### Building
```bash
npm run build     # One-time build
npm run dev       # Watch mode for development
```

### Testing Locally
```bash
# Test the built CLI
node dist/index.js connect github --dry-run

# Test with npx (requires publishing to npm)
npx mcphosting-cli connect github
```

## Contribution Guidelines

### 1. Code Style
- Use TypeScript
- Follow existing code patterns
- Add JSDoc comments for public functions
- Use meaningful variable and function names

### 2. Commit Messages
Use conventional commit format:
```
feat: add support for VS Code MCP configuration
fix: resolve issue with Claude Desktop config path
docs: update README with new examples
```

### 3. Pull Request Process
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes with tests
3. Update documentation if needed
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Submit a Pull Request

### 4. What to Contribute

**High-Priority Areas:**
- **New AI Client Support**: Add support for more AI tools (Copilot, Replit, etc.)
- **MCP Server Discovery**: Improve search and discovery features
- **Error Handling**: Better error messages and recovery
- **Testing**: Add unit tests and integration tests
- **Documentation**: Improve README, add guides

**Ideas for Contributors:**
- Add `--watch` mode to auto-restart clients on config changes
- Create a TUI (Terminal UI) for browsing MCP servers
- Add support for MCP server versioning
- Improve config validation and error messages
- Add shell completions (bash, zsh, fish)
- Create VS Code extension for MCP management

## Code of Conduct

### Be Respectful
- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community

### Be Collaborative
- Help newcomers get started
- Share knowledge and best practices
- Review code constructively
- Celebrate others' contributions

## Getting Help

**Questions or stuck?**
- 💬 [Join our Discord](https://discord.gg/mcphosting)
- 🐛 [Open an issue](https://github.com/gorlomi-enzo/mcphosting-cli/issues)
- 📧 Email: help@mcphosting.com

**Before opening an issue:**
1. Search existing issues first
2. Include your OS, Node.js version, and CLI version
3. Provide steps to reproduce the problem
4. Include relevant error messages

## Recognition

Contributors will be:
- Added to the README contributors section
- Mentioned in release notes
- Eligible for MCPHosting swag and credits

Thank you for helping make MCPHosting CLI better! 🚀

---

**Happy contributing!** 🎉