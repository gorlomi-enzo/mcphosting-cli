# Contributing to MCPHosting CLI

We love contributions! Here's how to get started.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gorlomi-enzo/mcphosting-cli.git
   cd mcphosting-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build and test:**
   ```bash
   npm run build
   node dist/index.js --help
   ```

## Project Structure

```
src/
├── index.ts          # CLI entry point
├── commands/         # Command implementations
│   ├── auth.ts       # login/logout/whoami
│   ├── connect.ts    # connect/disconnect/list
│   ├── import.ts     # import from other tools
│   ├── proxy.ts      # STDIO MCP proxy
│   ├── search.ts     # search/info marketplace
│   └── servers.ts    # server management (stubs)
├── lib/              # Shared utilities
│   ├── api.ts        # MCPHosting API client
│   ├── clients.ts    # AI client detection/config
│   ├── config.ts     # Local config management
│   └── logger.ts     # Pretty console output
└── types.ts          # TypeScript definitions
```

## Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes:**
   - Follow the existing code style
   - Add TypeScript types for new code
   - Test your changes with `npm run build && node dist/index.js`

3. **Test different scenarios:**
   ```bash
   # Test search
   node dist/index.js search github
   
   # Test connect (dry run)
   node dist/index.js connect github --client chatgpt
   
   # Test help
   node dist/index.js --help
   node dist/index.js connect --help
   ```

## Adding New Commands

1. **Create the command file** in `src/commands/`
2. **Export a function** that returns a `Command` object
3. **Import and add** to `src/index.ts`

Example:
```typescript
// src/commands/example.ts
import { Command } from 'commander';
import { Logger } from '../lib/logger.js';

export function createExampleCommand(): Command {
  return new Command('example')
    .description('Example command')
    .action(async () => {
      Logger.success('Hello world!');
    });
}

// src/index.ts
import { createExampleCommand } from './commands/example.js';
program.addCommand(createExampleCommand());
```

## Adding New MCP Servers

Static MCP servers are defined in `src/lib/api.ts` in the `getStaticMCPs()` method. Add new entries there for testing until the live API is available.

## Code Style

- Use TypeScript with strict mode
- Prefer async/await over Promises
- Use the Logger class for consistent output
- Add help text and examples to commands
- Handle errors gracefully with user-friendly messages

## Testing

Currently manual testing. Run these scenarios:

```bash
# Core functionality
npm run build
node dist/index.js search github
node dist/index.js info notion
node dist/index.js list
node dist/index.js connect github --client chatgpt

# Import testing (will show "not found" unless you have Smithery)
node dist/index.js import --from smithery --dry-run

# Help testing
node dist/index.js --help
node dist/index.js connect --help
```

## Submitting Changes

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```

2. **Push your branch:**
   ```bash
   git push origin feature/my-feature
   ```

3. **Create a Pull Request** on GitHub

## Growth Hacking Features

When adding commands, remember to include:

- Helpful error messages with next steps
- Links to GitHub repository in help text
- Sharing prompts after successful actions
- SEO-friendly descriptions and keywords

## Need Help?

- Open an issue on GitHub
- Check existing issues for similar problems
- Join our Discord: https://discord.gg/mcphosting

Thanks for contributing! 🚀