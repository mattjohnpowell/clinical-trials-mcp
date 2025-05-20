import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Import utility functions from utils.ts
import {
  fetchTrialsData,
  formatTrialData,
  formatSingleTrial,
  ClinicalTrial
} from "./utils.js";

// Create server instance
const server = new McpServer({
  name: "clinical-trials",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Interface for clinical trial data
interface ClinicalTrial {
  id?: string;
  title?: string;
  primarySponsor?: string;
  status?: string;
  registrationDate?: string;
  scientificTitle?: string;
  publicTitle?: string;
  studyType?: string;
  countries?: string[];
  contacts?: string[];
  conditions?: string[];
  phases?: string[];
  interventions?: string[];
  recruitmentStatus?: string;
  enrollmentTarget?: number;
  startDate?: string;
  completionDate?: string;
  url?: string;
}

// Helper function for making API requests
async function fetchTrialsData(searchParams: Record<string, string>): Promise<any> {
  // Log the request for debugging
  console.error(`Fetching trials with params: ${JSON.stringify(searchParams)}`);
  
  // Special handling for location-based searches (city within a country)
  if (searchParams.query && searchParams.country) {
    console.error(`Location-based search detected: ${searchParams.query} in ${searchParams.country}`);
    
    // For city searches, try using direct web search with the web API
    try {
      // First, try with clinicaltrials.gov which has better city-level search
      console.error(`Trying ClinicalTrials.gov for city-level search first`);
      return await fetchClinicalTrialsGovData(searchParams);
    } catch (ctgError) {
      console.error(`ClinicalTrials.gov search failed, falling back to ICTRP API`, ctgError);
      // Fall through to regular ICTRP search if ClinicalTrials.gov fails
    }
  }
  
  const url = new URL(ICTRP_API_URL);
  
  // Add search parameters to the URL
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });
  
  try {
    console.error(`Requesting URL: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/xml"
      }
    });

    if (!response.ok) {
      console.error(`ICTRP API error: ${response.status} - ${response.statusText}`);
      
      // Check if we should try a direct web search instead
      if (response.status === 404) {
        console.error(`404 error - ICTRP API may not support this search pattern, trying alternate approaches`);
        
        // Try without the country parameter first (sometimes country filtering is problematic)
        if (searchParams.country) {
          const countryLessParams = { ...searchParams };
          delete countryLessParams.country;
          console.error(`Trying without country parameter: ${JSON.stringify(countryLessParams)}`);
          
          try {
            return await fetchTrialsDataFallback(countryLessParams);
          } catch (noCountryError) {
            console.error(`Search without country failed too, trying ClinicalTrials.gov`);
            return await fetchClinicalTrialsGovData(searchParams);
          }
        } else {
          // If no country was specified, just try the fallback immediately
          return await fetchTrialsDataFallback(searchParams);
        }
      }
      
      // For other errors, try the regular fallback
      if (searchParams.search && searchParams.country) {
        // If the search likely contains a city, try falling back to country-only search
        console.error(`Attempting fallback to country-only search`);
        return await fetchTrialsDataFallback(searchParams);
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // The API returns XML data which we need to parse
    const xmlText = await response.text();
    
    try {
      // Log the first few characters of the response for debugging
      console.error(`Received XML response (first 100 chars): ${xmlText.substring(0, 100)}...`);
      return parser.parse(xmlText);
    } catch (parseErr: any) {
      console.error(`Error parsing XML: ${parseErr}`);
      throw new Error(`Failed to parse XML response: ${parseErr ? (parseErr as Error).message : "Unknown parsing error"}`);
    }
  } catch (error) {
    console.error("Error fetching ICTRP data:", error);
    throw error;
  }
}

// Fallback function when the original search fails - tries with simplified parameters
async function fetchTrialsDataFallback(originalParams: Record<string, string>): Promise<any> {
  // Create a copy of the parameters without the search (city) term
  const fallbackParams = { ...originalParams };
  
  // If we had a city in the search term, remove it and just search by country
  if (fallbackParams.search) {
    delete fallbackParams.search;
  }
  
  console.error(`ICTRP fallback search with params: ${JSON.stringify(fallbackParams)}`);
  
  const url = new URL(ICTRP_API_URL);
  
  // Add search parameters to the URL
  Object.entries(fallbackParams).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });
  
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/xml"
      }
    });

    if (!response.ok) {
      // If ICTRP API fails, try ClinicalTrials.gov as a secondary fallback
      console.error(`ICTRP fallback search failed with status ${response.status}, trying ClinicalTrials.gov`);
      return await fetchClinicalTrialsGovData(originalParams);
    }

    // The API returns XML data which we need to parse
    const xmlText = await response.text();
    return parser.parse(xmlText);
  } catch (error) {
    console.error("Error in ICTRP fallback search:", error);
    // Try ClinicalTrials.gov as a last resort
    return await fetchClinicalTrialsGovData(originalParams);
  }
}

// Function to search ClinicalTrials.gov as an alternative data source
async function fetchClinicalTrialsGovData(originalParams: Record<string, string>): Promise<any> {
  try {
    console.error(`Searching ClinicalTrials.gov with params: ${JSON.stringify(originalParams)}`);
    
    // Build clinicaltrials.gov compatible search term
    let searchTerm = '';
    
    // Add condition to search term
    if (originalParams.condition) {
      searchTerm += `${originalParams.condition}`;
    }
      // Add location information
    if (originalParams.country) {
      searchTerm += ` AND COUNTRY:${originalParams.country}`;
      
      // If city/location is specified in the search, add it
      if (originalParams.search) {
        // Support for specific city searches
        try {
          // By the context, we're assuming the search parameter contains a city name
          searchTerm += ` AND AREA[City]:${originalParams.search}`;
          console.error(`Added city search term: AREA[City]:${originalParams.search}`);
        } catch (e) {
          console.error(`Error adding city search term: ${e}`);
          // If there's an error with the city search syntax, just use the search term directly
          searchTerm += ` AND ${originalParams.search}`;
        }
      }
    }
    
    // Add recruitment status if specified
    if (originalParams.recruitment) {
      searchTerm += ` AND AREA[RecruitmentsStatus]:${originalParams.recruitment}`;
    }
    
    // Build the URL for ClinicalTrials.gov API
    const url = new URL(CLINICALTRIALS_GOV_URL);
    url.searchParams.append("expr", searchTerm);
    url.searchParams.append("min_rnk", "1");
    url.searchParams.append("max_rnk", originalParams.max || "20");
    url.searchParams.append("fmt", "json");
    
    console.error(`ClinicalTrials.gov URL: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`ClinicalTrials.gov search failed: HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return convertClinicalTrialsGovFormat(data, originalParams);
  } catch (error) {
    console.error("Error in ClinicalTrials.gov search:", error);
    throw error;
  }
}

// Function to convert ClinicalTrials.gov data to a format similar to ICTRP
function convertClinicalTrialsGovFormat(ctgData: any, originalParams: Record<string, string>): any {
  try {
    // Extract studies from the response
    const studies = ctgData.FullStudiesResponse?.FullStudies || [];
    
    if (!studies.length) {
      return { trials: { trial: [] } };
    }
    
    // Convert to ICTRP-like format
    const trials = studies.map((study: any) => {
      const studyData = study.Study || {};
      const protocolSection = studyData.ProtocolSection || {};
      const identificationModule = protocolSection.IdentificationModule || {};
      const statusModule = protocolSection.StatusModule || {};
      const sponsorCollaboratorsModule = protocolSection.SponsorCollaboratorsModule || {};
      const conditionsModule = protocolSection.ConditionsModule || {};
      const designModule = protocolSection.DesignModule || {};
      const locationData = protocolSection.ContactsLocationsModule?.LocationList?.Location || [];
      
      // Format conditions
      const conditions = conditionsModule.ConditionList?.Condition || [];
      
      // Format countries
      const countries = Array.isArray(locationData) 
        ? [...new Set(locationData.map((loc: any) => loc.Country))]
        : locationData.Country 
          ? [locationData.Country] 
          : [];
      
      return {
        trialID: identificationModule.NCTId || 'Unknown',
        scientificTitle: identificationModule.OfficialTitle || '',
        publicTitle: identificationModule.BriefTitle || '',
        primarySponsor: sponsorCollaboratorsModule.LeadSponsor?.Name || 'Not specified',
        recruitmentStatus: statusModule.OverallStatus || 'Unknown',
        phase: designModule.PhaseList?.Phase?.join(', ') || 'Not specified',
        studyType: designModule.StudyType || 'Not specified',
        registerDate: statusModule.StudyFirstSubmitDate || 'Not specified',
        countries: { country: countries },
        conditions: { condition: conditions },
        startDate: statusModule.StartDate || 'Not specified',
        completionDate: statusModule.CompletionDate || 'Not specified',
      };
    });
    
    return { trials: { trial: trials } };
  } catch (error) {
    console.error("Error converting ClinicalTrials.gov data:", error);
    return { trials: { trial: [] } };
  }
}

// Function to parse and format trial data from XML response
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
      scientificTitle: trial.scientificTitle || '',
      publicTitle: trial.publicTitle || '',
      studyType: trial.studyType || 'Not specified',      countries: trial.countries?.country 
                ? (Array.isArray(trial.countries.country) 
                   ? trial.countries.country 
                   : [trial.countries.country]) 
                : trial.countries // Fallback if the structure is different (from different APIs)
                  ? (Array.isArray(trial.countries) 
                     ? trial.countries 
                     : [trial.countries])
                  : ['Not specified'],
      contacts: trial.contacts?.contact 
               ? (Array.isArray(trial.contacts.contact) 
                  ? trial.contacts.contact.map((c: any) => c.lastName + ', ' + c.firstName) 
                  : [trial.contacts.contact.lastName + ', ' + trial.contacts.contact.firstName]) 
               : ['Not specified'],
      conditions: trial.conditions?.condition 
                 ? (Array.isArray(trial.conditions.condition) 
                    ? trial.conditions.condition 
                    : [trial.conditions.condition]) 
                 : ['Not specified'],
      phases: trial.phase 
             ? (Array.isArray(trial.phase) 
                ? trial.phase 
                : [trial.phase]) 
             : ['Not specified'],
      interventions: trial.interventions?.intervention 
                    ? (Array.isArray(trial.interventions.intervention) 
                       ? trial.interventions.intervention 
                       : [trial.interventions.intervention]) 
                    : ['Not specified'],
      recruitmentStatus: trial.recruitmentStatus || 'Unknown',
      enrollmentTarget: trial.enrollmentTarget ? parseInt(trial.enrollmentTarget) : undefined,
      startDate: trial.startDate || 'Not specified',
      completionDate: trial.completionDate || 'Not specified',
      url: trial.trialID ? `https://trialsearch.who.int/Trial2.aspx?TrialID=${trial.trialID}` : undefined
    };
  });
}

// Format a single clinical trial for display
function formatSingleTrial(trial: ClinicalTrial): string {
  return `
Trial ID: ${trial.id || 'Not available'}
Title: ${trial.title || 'Not available'}
Status: ${trial.recruitmentStatus || 'Unknown'}
Registration Date: ${trial.registrationDate || 'Not available'}
Study Type: ${trial.studyType || 'Not specified'}
Phase: ${Array.isArray(trial.phases) ? trial.phases.join(', ') : trial.phases || 'Not specified'}
Countries: ${Array.isArray(trial.countries) ? trial.countries.join(', ') : trial.countries || 'Not specified'}
Conditions: ${Array.isArray(trial.conditions) ? trial.conditions.join(', ') : trial.conditions || 'Not specified'}
Interventions: ${Array.isArray(trial.interventions) ? trial.interventions.join(', ') : trial.interventions || 'Not specified'}
Primary Sponsor: ${trial.primarySponsor || 'Not specified'}
Start Date: ${trial.startDate || 'Not specified'}
Completion Date: ${trial.completionDate || 'Not specified'}
Enrollment Target: ${trial.enrollmentTarget || 'Not specified'}
URL: ${trial.url || 'Not available'}
`;
}

// Register clinical trials search tool
server.tool(
  "search-clinical-trials",
  "Search for clinical trials using keywords, condition, country, or other parameters",
  {
    query: z.string().optional().describe("Search query for finding trials by keyword"),
    condition: z.string().optional().describe("Medical condition or disease being studied"),
    country: z.string().optional().describe("Country where the trial is conducted"),
    sponsor: z.string().optional().describe("Organization sponsoring the trial"),
    phase: z.string().optional().describe("Trial phase (e.g., 'Phase 1', 'Phase 2', 'Phase 3')"),
    recruitmentStatus: z.string().optional().describe("Trial recruitment status (e.g., 'Recruiting', 'Completed')"),
    dateFrom: z.string().optional().describe("Start date for search range (YYYY-MM-DD)"),
    dateTo: z.string().optional().describe("End date for search range (YYYY-MM-DD)"),
    maxResults: z.number().optional().default(10).describe("Maximum number of results to return")
  },  async ({ query, condition, country, sponsor, phase, recruitmentStatus, dateFrom, dateTo, maxResults = 10 }) => {
    try {
      const searchParams: Record<string, string> = {};
      let data: any;

      // Special case for city-based searches
      // If the query looks like a city and a country is provided, we'll handle it specially
      let citySearch = false;
      if (query && country) {
        console.error(`Potential city search detected: "${query}" in "${country}"`);
        // This looks like a city-based search
        citySearch = true;
        // Will be handled specially
      }
      
      // Normal keyword search (used for fallback or non-city searches)
      if (query) searchParams.search = query; // ICTRP API uses 'search' not 'query'
      
      // Add other search parameters
      if (condition) searchParams.condition = condition;
      if (country) searchParams.country = country;
      if (sponsor) searchParams.sponsor = sponsor;
      if (phase) searchParams.phase = phase;
      if (recruitmentStatus) searchParams.recruitment = recruitmentStatus;
      if (dateFrom) searchParams.dateFrom = dateFrom;
      if (dateTo) searchParams.dateTo = dateTo;
      
      // Always limit results to avoid overwhelming responses
      searchParams.max = Math.min(maxResults, 50).toString();
        // For city-based searches, use a more direct approach with ClinicalTrials.gov
      if (citySearch) {
        console.error(`Using ClinicalTrials.gov for city search: ${query} in ${country}`);
        try {
          data = await fetchClinicalTrialsGovData(searchParams);
        } catch (ctgError) {
          console.error("ClinicalTrials.gov search failed:", ctgError);
          // Fall back to regular ICTRP search
          data = await fetchTrialsData(searchParams);
        }
      } else {
        // Regular search using ICTRP API
        data = await fetchTrialsData(searchParams);
      }
      const trials = formatTrialData(data);      if (!trials || trials.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No clinical trials found matching your search criteria. The search parameters were: ${JSON.stringify({
                query, condition, country, sponsor, phase, recruitmentStatus
              })}`
            },
          ],
        };
      }

      const formattedTrials = trials.map(formatSingleTrial);
      const resultsText = `Found ${trials.length} clinical trials matching your search criteria.\n\n${formattedTrials.join('\n---\n')}`;

      return {
        content: [
          {
            type: "text",
            text: resultsText,
          },
        ],
      };
    } catch (error) {
      console.error("Error in search-clinical-trials tool:", error);
      
      // Provide more helpful error messages and suggestions
      let errorMessage = `Error searching for clinical trials: ${(error as Error).message || "Unknown error"}`;
      let suggestion = "";
        if ((error as Error).message?.includes("404")) {
        suggestion = `\n\nThe ICTRP API may not support the specific search parameters you provided. 
Try these suggestions:
1. Search by condition only, without specifying location
2. Try a broader search with fewer parameters
3. Use ClinicalTrials.gov directly at https://clinicaltrials.gov/`;
      } else if ((error as Error).message?.includes("timeout") || (error as Error).message?.includes("network")) {
        suggestion = `\n\nThere may be network connectivity issues or the ICTRP API may be temporarily unavailable. Please try again later.`;
      }
      
      // Special message for city searches that failed
      if (query && country) {
        suggestion += `\n\nFor city-based searches like "${query}" in "${country}", try:
1. Searching for the condition and country only, without mentioning the city
2. Using more general location terms
3. Checking the spelling of the city name`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: errorMessage + suggestion,
          },
        ],
      };
    }
  }
);

// Register clinical trial details tool
server.tool(
  "get-trial-details",
  "Get detailed information about a specific clinical trial by its ID",
  {
    trialId: z.string().describe("The unique identifier for the clinical trial (e.g., NCT identifier or WHO registry ID)")
  },
  async ({ trialId }) => {
    try {
      const searchParams: Record<string, string> = {
        trialid: trialId
      };

      const data = await fetchTrialsData(searchParams);
      const trials = formatTrialData(data);

      if (!trials || trials.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No clinical trial found with ID: ${trialId}`
            },
          ],
        };
      }

      const trial = trials[0]; // Should only be one trial for a specific ID
      const detailedText = formatSingleTrial(trial);

      return {
        content: [
          {
            type: "text",
            text: detailedText,
          },
        ],
      };
    } catch (error) {
      console.error("Error in get-trial-details tool:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving clinical trial details: ${(error as Error).message || "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// Main function to run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Clinical Trials MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
