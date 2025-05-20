<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Clinical Trials MCP Server

This is a Model Context Protocol (MCP) server for accessing clinical trial data from the World Health Organization's International Clinical Trials Registry Platform (ICTRP).

You can find more info and examples at https://modelcontextprotocol.io/llms-full.txt

## Project Structure

- `src/index.ts`: Main server file implementing the MCP tools for clinical trials data
- `.vscode/mcp.json`: MCP server configuration for VS Code integration

## Key APIs and Libraries

- `@modelcontextprotocol/sdk`: MCP SDK for building MCP servers
- `fast-xml-parser`: Library for parsing XML responses from the ICTRP API
- `zod`: Schema validation library for tool parameters

## Additional Resources

- ICTRP API: https://trialsearch.who.int/api/v2/trials
- Model Context Protocol: https://modelcontextprotocol.io/
