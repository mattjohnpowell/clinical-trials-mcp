// Example script demonstrating how to interact with the Clinical Trials MCP server
// This is a simplified simulation and doesn't rely on actual MCP client libraries
import { spawn } from 'child_process';
import { once } from 'events';

// Simulate an MCP client connection to our server
const simulateMcpClient = async () => {
  console.log("Starting Clinical Trials MCP Server...");
  
  // Start the server process
  const serverProcess = spawn('node', ['../build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Set up error handling
  serverProcess.on('error', (err) => {
    console.error('Failed to start MCP server:', err);
  });
  
  // Give the server a moment to start up
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("Server started, simulating MCP client connection");
  
  // Simulate tool calls
  console.log("\n=== Available MCP Tools ===");
  console.log("1. search-clinical-trials");
  console.log("2. get-trial-details");
  
  // Example: Simulate a search for diabetes clinical trials
  console.log("\n=== Example: Searching for diabetes clinical trials ===");
  const searchRequest = {
    toolName: "search-clinical-trials",
    arguments: {
      condition: "diabetes",
      country: "United States",
      maxResults: 3
    }
  };
  
  console.log("Request:");
  console.log(JSON.stringify(searchRequest, null, 2));
  
  console.log("\nSimulated response:");
  console.log(`Found 3 clinical trials matching your search criteria.

Trial ID: NCT04993924
Title: Study of Effectiveness of TriGuard in Type 2 Diabetes
Status: Recruiting
Registration Date: 2021-05-12
Countries: United States
Conditions: Type 2 Diabetes
Interventions: TriGuard Oral Medication
Primary Sponsor: DiabetesCare Inc
Start Date: 2021-06-01
Completion Date: 2023-12-31
URL: https://trialsearch.who.int/Trial2.aspx?TrialID=NCT04993924

---

Trial ID: NCT05002868
Title: Evaluation of GLP-1 Agonist for Diabetes Control
Status: Active, not recruiting
Registration Date: 2020-11-30
Countries: United States
Conditions: Diabetes Mellitus, Type 2
Interventions: GLP-1 receptor agonist
Primary Sponsor: University Medical Center
Start Date: 2021-01-15
Completion Date: 2022-06-30
URL: https://trialsearch.who.int/Trial2.aspx?TrialID=NCT05002868`);

  // Example: Simulate getting details for a specific trial
  console.log("\n=== Example: Getting details for a specific trial ===");
  const detailsRequest = {
    toolName: "get-trial-details",
    arguments: {
      trialId: "NCT04368728"
    }
  };
  
  console.log("Request:");
  console.log(JSON.stringify(detailsRequest, null, 2));
  
  console.log("\nSimulated response:");
  console.log(`Trial ID: NCT04368728
Title: Study to Evaluate the Safety and Efficacy of the COVID-19 Vaccine
Status: Completed
Registration Date: 2020-04-29
Study Type: Interventional
Phase: Phase 3
Countries: United States, Brazil, South Africa
Conditions: COVID-19
Interventions: mRNA-based vaccine
Primary Sponsor: BioPharmCo
Start Date: 2020-07-27
Completion Date: 2021-11-14
Enrollment Target: 43998
URL: https://trialsearch.who.int/Trial2.aspx?TrialID=NCT04368728`);
  
  // Terminate the server process
  console.log("\nSimulation complete, terminating MCP server");
  serverProcess.kill();
};

// Run the example
simulateMcpClient().catch(console.error);
