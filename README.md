# Clinical Trials MCP Server

This is a Model Context Protocol (MCP) server for accessing clinical trial data from the World Health Organization's International Clinical Trials Registry Platform (ICTRP).

## Recent Improvements

- **Enhanced Error Handling**: Better error messages with suggestions for fixing search issues
- **Fallback Mechanism**: When specific searches fail, the server attempts broader searches
- **Parameter Corrections**: Fixed parameter naming for better compatibility with the ICTRP API
- **Improved Logging**: Added detailed logging to help with troubleshooting

## Features

The server provides the following tools:

### 1. Search Clinical Trials

Search for clinical trials using various parameters:

- `query`: Search query for finding trials by keyword
- `condition`: Medical condition or disease being studied
- `country`: Country where the trial is conducted
- `sponsor`: Organization sponsoring the trial
- `phase`: Trial phase (e.g., 'Phase 1', 'Phase 2', 'Phase 3')
- `recruitmentStatus`: Trial recruitment status (e.g., 'Recruiting', 'Completed')
- `dateFrom`: Start date for search range (YYYY-MM-DD)
- `dateTo`: End date for search range (YYYY-MM-DD)
- `maxResults`: Maximum number of results to return (default: 10, max: 50)

### 2. Get Trial Details

Get detailed information about a specific clinical trial by its ID:

- `trialId`: The unique identifier for the clinical trial (e.g., NCT identifier or WHO registry ID)

## Installation

1. Clone this repository
2. Install dependencies with `npm install`
3. Build the project with `npm run build`
4. Start the server with `npm start`

## Integration with Claude for Desktop

To configure this MCP server with Claude for Desktop, edit your Claude for Desktop configuration file:

### Windows
```json
{
    "mcpServers": {
        "clinical-trials-mcp": {
            "command": "node",
            "args": [
                "C:\\Path\\To\\ClinicalTrials-MCP\\build\\index.js"
            ]
        }
    }
}
```

### MacOS/Linux
```json
{
    "mcpServers": {
        "clinical-trials-mcp": {
            "command": "node",
            "args": [
                "/path/to/ClinicalTrials-MCP/build/index.js"
            ]
        }
    }
}
```

## Usage

Once integrated with an MCP client like Claude for Desktop, you can ask questions about clinical trials such as:

- "Find clinical trials for diabetes in the United States"
- "Search for cancer trials sponsored by Novartis"
- "Get details for clinical trial NCT01234567"

## Examples and Utilities

The project includes several examples and utility scripts to help you get started:

### API Connection Testing

Test the connection to the ICTRP API:
```bash
npm run test-api
```

### XML Parsing Testing

Test the XML parsing functionality with sample data:
```bash
npm run test-xml
```

### Example Client

Run an example client that connects to the MCP server:
```bash
npm run example:client
```

### Demo HTML Client

The project includes an HTML demo client that simulates how an application would interact with the MCP server. Open the following file in your browser:
```
examples/demo-client.html
```

## Additional Documentation

- `CONTRIBUTING.md`: Guidelines for contributing to the project
- `testing-guide.md`: Guide for testing the MCP server
- `next-steps.md`: Ideas for future improvements
- `claude_desktop_config.example.json`: Example configuration for Claude for Desktop

## License

ISC

## ICTRP API Usage Note

This MCP server uses the WHO ICTRP Search Portal Web Service, which is available to the public for research purposes only. Please ensure you're using this tool in accordance with the WHO ICTRP terms of service.
