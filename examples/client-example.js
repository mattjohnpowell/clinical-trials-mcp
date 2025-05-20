// Example script to interact with the Clinical Trials MCP server directly
// This would be used by other applications to connect to the MCP server
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp";
import { SubprocessClientTransport } from "@modelcontextprotocol/sdk/client/subprocess";
// Create an instance of the MCP client connected to our server
const startServer = async () => {
    const transport = new SubprocessClientTransport({
        command: "node",
        args: ["../build/index.js"],
    });
    const client = new McpClient({
        transport,
    });
    // Initialize the connection
    await client.initialize();
    console.log("Connected to Clinical Trials MCP Server");
    // List available tools
    const tools = await client.listTools();
    console.log("Available tools:");
    console.log(tools);
    // Example: Search for clinical trials
    try {
        console.log("\n--- Searching for diabetes clinical trials ---");
        const searchResult = await client.callTool({
            name: "search-clinical-trials",
            arguments: {
                condition: "diabetes",
                maxResults: 3
            }
        });
        console.log("Search results:");
        console.log(JSON.stringify(searchResult, null, 2));
        // Example: Get details for a specific trial
        // In a real application, you might extract the trial ID from the search results
        console.log("\n--- Getting details for a specific trial ---");
        const detailsResult = await client.callTool({
            name: "get-trial-details",
            arguments: {
                trialId: "NCT04368728" // Example trial ID
            }
        });
        console.log("Trial details:");
        console.log(JSON.stringify(detailsResult, null, 2));
    }
    catch (error) {
        console.error("Error calling tool:", error);
    }
    // Close the connection
    await client.close();
    console.log("Disconnected from Clinical Trials MCP Server");
};
// Run the example
startServer().catch(console.error);
