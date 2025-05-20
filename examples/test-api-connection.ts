// Simple script to verify connection to the ICTRP API
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

const ICTRP_API_URL = "https://trialsearch.who.int/api/v2/trials";
const USER_AGENT = "clinical-trials-mcp-test/1.0";

// Create an instance of the XML parser
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

async function testApiConnection() {
  console.log("Testing connection to ICTRP API...");
  
  try {
    // Make a simple request to get a small number of trials
    const url = new URL(ICTRP_API_URL);
    url.searchParams.append("search", "test");
    url.searchParams.append("max", "2");
    
    console.log(`Requesting: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/xml"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log("Received XML response, parsing...");
    
    const data = parser.parse(xmlText);
    
    console.log("Successfully parsed XML:");
    console.log(JSON.stringify(data, null, 2));
    
    const trials = data?.trials?.trial;
    const trialCount = Array.isArray(trials) ? trials.length : (trials ? 1 : 0);
    
    console.log(`\n✅ API Connection test successful! Found ${trialCount} trial(s).`);
    console.log("You can now use the MCP server with confidence.");
    
  } catch (error) {
    console.error("❌ Error testing API connection:");
    console.error(error);
    console.log("Please check your network connection and try again.");
  }
}

// Run the test
testApiConnection().catch(console.error);
