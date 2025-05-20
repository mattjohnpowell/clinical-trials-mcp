# Contributing to Clinical Trials MCP Server

Thank you for your interest in contributing to the Clinical Trials MCP server! This guide will help you get started with development and contributions.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ClinicalTrials-MCP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Run the server:**
   ```bash
   npm start
   ```

## Project Structure

- `src/index.ts`: Main MCP server implementation
- `examples/`: Example client code and utility scripts
- `.vscode/`: VS Code configuration files for tasks, launch, and MCP integration

## Available Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run the compiled MCP server
- `npm run dev`: Build and run the server in one command
- `npm run test-api`: Test the connection to the ICTRP API
- `npm run example:client`: Run the example client that connects to the MCP server

## VS Code Tasks

The project includes several VS Code tasks to streamline development:

- **Build TypeScript**: Compiles the TypeScript code
- **Run MCP Server**: Runs the compiled server
- **Build and Run MCP Server**: Combines build and run operations
- **Stop MCP Server**: Terminates any running server processes

## Adding New Features

### Adding a New Tool

1. Define the tool parameters using Zod schema in `src/index.ts`
2. Implement the tool function with proper error handling
3. Register the tool with the MCP server using `server.tool()`
4. Update documentation in README.md to reflect the new capability

### Example:

```typescript
// Define a new tool for getting trial statistics
server.tool(
  "get-trial-statistics",
  "Get statistical information about clinical trials for a condition",
  {
    condition: z.string().describe("Medical condition to analyze")
  },
  async ({ condition }) => {
    try {
      // Implementation here
      
      return {
        content: [
          {
            type: "text",
            text: "Statistical information..."
          }
        ]
      };
    } catch (error) {
      // Error handling
    }
  }
);
```

## Testing

Currently, the project uses manual testing. To verify changes:

1. Build the project with `npm run build`
2. Run the server with `npm start`
3. Use the example client or an MCP client like Claude for Desktop to test

## Pull Request Process

1. Fork the repository and create a branch for your feature
2. Implement your changes with appropriate tests
3. Update documentation to reflect your changes
4. Submit a pull request with a clear description of your changes

## Code Style

- Use TypeScript's strict mode
- Format code using Prettier
- Follow existing patterns for error handling and response formatting

## License

By contributing to this project, you agree that your contributions will be licensed under the project's license.
