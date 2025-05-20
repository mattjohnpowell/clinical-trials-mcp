// Simple script to test the XML parsing functionality
import fs from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an instance of the XML parser
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

// Interface for clinical trial data (simplified version for testing)
interface ClinicalTrial {
  id?: string;
  title?: string;
  primarySponsor?: string;
  status?: string;
  registrationDate?: string;
}

// Function to parse and format trial data from XML response (simplified)
function formatTrialData(data: any): ClinicalTrial[] {
  // Extract the trials array from the response
  const trials = data?.trials?.trial;
  
  if (!trials) {
    return [];
  }

  // Convert to array if single item
  const trialsArray = Array.isArray(trials) ? trials : [trials];
  
  return trialsArray.map((trial: any) => {
    return {
      id: trial.trialID || 'Unknown',
      title: trial.publicTitle || trial.scientificTitle || 'No title available',
      primarySponsor: trial.primarySponsor || 'Not specified',
      status: trial.recruitmentStatus || 'Unknown',
      registrationDate: trial.registerDate || 'Not specified',
    };
  });
}

// Format a single clinical trial for display (simplified)
function formatSingleTrial(trial: ClinicalTrial): string {
  return `
Trial ID: ${trial.id || 'Not available'}
Title: ${trial.title || 'Not available'}
Status: ${trial.status || 'Unknown'}
Registration Date: ${trial.registrationDate || 'Not available'}
Primary Sponsor: ${trial.primarySponsor || 'Not specified'}
`;
}

// Test with a sample XML response
async function runTest() {
  const sampleXml = `
  <trials>
    <trial>
      <trialID>NCT04275414</trialID>
      <publicTitle>Clinical Study of Treatment of COVID-19</publicTitle>
      <scientificTitle>Clinical Study of Treatment of COVID-19 with Repurposed Drugs</scientificTitle>
      <primarySponsor>University Medical Center</primarySponsor>
      <recruitmentStatus>Recruiting</recruitmentStatus>
      <registerDate>2020-02-18</registerDate>
      <countries>
        <country>China</country>
      </countries>
    </trial>
    <trial>
      <trialID>NCT04348409</trialID>
      <publicTitle>Vaccine Study for COVID-19 Prevention</publicTitle>
      <scientificTitle>Randomized, Double-blind, Placebo-controlled Phase 2/3 Study of COVID-19 Vaccine</scientificTitle>
      <primarySponsor>BioPharm Inc</primarySponsor>
      <recruitmentStatus>Completed</recruitmentStatus>
      <registerDate>2020-04-15</registerDate>
      <countries>
        <country>United States</country>
        <country>United Kingdom</country>
      </countries>
    </trial>
  </trials>
  `;
  try {
    console.log("Parsing sample XML...");
    // Parse the XML string directly
    const parsedData = parser.parse(sampleXml);
    
    console.log("Formatting trial data...");
    const trials = formatTrialData(parsedData);
    
    console.log("Formatted trials:");
    trials.forEach((trial, index) => {
      console.log(`\n--- Trial ${index + 1} ---`);
      console.log(formatSingleTrial(trial));
    });
    
    console.log("✅ XML parsing test completed successfully");
  } catch (error) {
    console.error("❌ Error in XML parsing test:");
    console.error(error);
  }
}

runTest().catch(console.error);
