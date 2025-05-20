// test-city-search-utils.ts
// This utility helps test the city search functionality that's causing issues

import fetch from 'node-fetch';

// Constants from the main file
const USER_AGENT = "clinical-trials-mcp/1.0";
const CLINICALTRIALS_GOV_URL = "https://clinicaltrials.gov/api/query/full_studies";

// A simplified version of the fetchClinicalTrialsGovData function for testing
export async function testClinicalTrialsGovSearch(condition: string, country: string, city: string, maxResults: number = 10): Promise<any> {
  try {
    console.log(`Testing search for ${condition} in ${city}, ${country}`);
    
    // Build clinicaltrials.gov compatible search term
    let searchTerm = '';
    
    // Add condition to search term
    if (condition) {
      searchTerm += `${condition}`;
    }
    
    // Add location information
    if (country) {
      searchTerm += ` AND COUNTRY:${country}`;
      
      // Add city search
      if (city) {
        searchTerm += ` AND AREA[City]:${city}`;
      }
    }
    
    // Build the URL for ClinicalTrials.gov API
    const url = new URL(CLINICALTRIALS_GOV_URL);
    url.searchParams.append("expr", searchTerm);
    url.searchParams.append("min_rnk", "1");
    url.searchParams.append("max_rnk", maxResults.toString());
    url.searchParams.append("fmt", "json");
    
    console.log(`ClinicalTrials.gov URL: ${url.toString()}`);
    
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
    return data;
  } catch (error) {
    console.error("Error in ClinicalTrials.gov search:", error);
    throw error;
  }
}

// Function to validate the response contains the expected city
export function validateCityInResponse(response: any, city: string): boolean {
  const studies = response?.FullStudiesResponse?.FullStudies || [];
  
  if (!studies.length) {
    console.log("No studies found in the response");
    return false;
  }
  
  let cityFound = false;
  
  // Look for the city in each study's locations
  for (const study of studies) {
    const locations = study.Study?.ProtocolSection?.ContactsLocationsModule?.LocationList?.Location || [];
    const locationsArray = Array.isArray(locations) ? locations : [locations];
    
    for (const location of locationsArray) {
      if (location.City && location.City.toLowerCase().includes(city.toLowerCase())) {
        cityFound = true;
        console.log(`Found city ${location.City} in study ${study.Study?.ProtocolSection?.IdentificationModule?.NCTId}`);
      }
    }
  }
  
  return cityFound;
}

// Example usage:
// You can run this to test if the city-based search is working properly
if (require.main === module) {
  (async () => {
    try {
      const condition = "Acute Myeloid Leukemia";
      const country = "United Kingdom"; 
      const city = "London";
      
      const result = await testClinicalTrialsGovSearch(condition, country, city);
      console.log("Search successful");
      
      const cityFound = validateCityInResponse(result, city);
      console.log(`City ${city} found in response: ${cityFound}`);
      
      // Output the first study for inspection
      const firstStudy = result?.FullStudiesResponse?.FullStudies?.[0];
      if (firstStudy) {
        console.log("First study details:");
        console.log(JSON.stringify(firstStudy, null, 2));
      }
    } catch (error) {
      console.error("Test failed:", error);
    }
  })();
}
