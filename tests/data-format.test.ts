import { describe, expect, test } from '@jest/globals';
import { XMLParser } from "fast-xml-parser";

// Create a separate testing module for the format conversion
// This helps us isolate and test the logic that's causing problems

// Mock data for testing
const mockClinicalTrialsGovData = {
  "FullStudiesResponse": {
    "FullStudies": [
      {
        "Study": {
          "ProtocolSection": {
            "IdentificationModule": {
              "NCTId": "NCT98765432",
              "BriefTitle": "London AML Trial",
              "OfficialTitle": "London-based Clinical Trial for Acute Myeloid Leukemia"
            },
            "StatusModule": {
              "OverallStatus": "Recruiting",
              "StudyFirstSubmitDate": "2023-03-15",
              "StartDate": "2023-04-01",
              "CompletionDate": "2026-04-01"
            },
            "SponsorCollaboratorsModule": {
              "LeadSponsor": {
                "Name": "London Hospital"
              }
            },
            "ConditionsModule": {
              "ConditionList": {
                "Condition": [
                  "Acute Myeloid Leukemia"
                ]
              }
            },
            "DesignModule": {
              "StudyType": "Interventional",
              "PhaseList": {
                "Phase": [
                  "Phase 3"
                ]
              }
            },
            "ContactsLocationsModule": {
              "LocationList": {
                "Location": [
                  {
                    "Facility": "London Hospital",
                    "City": "London",
                    "Country": "United Kingdom"
                  }
                ]
              }
            }
          }
        }
      }
    ]
  }
};

describe('Clinical Trials Format Tests', () => {
  test('should convert ClinicalTrials.gov data format correctly', () => {
    // Here we recreate the conversion function for testing
    // This is based on the function in src/index.ts
    function convertClinicalTrialsGovFormat(ctgData: any, originalParams: Record<string, string>): any {
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
    }

    // Test the conversion function
    const result = convertClinicalTrialsGovFormat(mockClinicalTrialsGovData, {});
    
    // Validate the conversion results
    expect(result).toHaveProperty('trials');
    expect(result.trials).toHaveProperty('trial');
    expect(Array.isArray(result.trials.trial)).toBe(true);
    
    const trial = result.trials.trial[0];
    expect(trial.trialID).toBe('NCT98765432');
    expect(trial.publicTitle).toBe('London AML Trial');
    expect(trial.scientificTitle).toBe('London-based Clinical Trial for Acute Myeloid Leukemia');
    expect(trial.primarySponsor).toBe('London Hospital');
    expect(trial.recruitmentStatus).toBe('Recruiting');
    expect(trial.countries).toHaveProperty('country');
    expect(Array.isArray(trial.countries.country)).toBe(true);
    expect(trial.countries.country).toContain('United Kingdom');
  });

  test('should format trial data correctly', () => {
    // Test function for formatting trial data
    function formatTrialData(data: any): any[] {
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
          studyType: trial.studyType || 'Not specified',
          countries: trial.countries?.country 
                    ? (Array.isArray(trial.countries.country) 
                      ? trial.countries.country 
                      : [trial.countries.country]) 
                    : trial.countries // Fallback if the structure is different (from different APIs)
                      ? (Array.isArray(trial.countries) 
                        ? trial.countries 
                        : [trial.countries])
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
          recruitmentStatus: trial.recruitmentStatus || 'Unknown',
          startDate: trial.startDate || 'Not specified',
          completionDate: trial.completionDate || 'Not specified',
        };
      });
    }

    // Create test data to validate the formatting
    const mockData = {
      trials: {
        trial: {
          trialID: 'NCT12345678',
          publicTitle: 'Test Clinical Trial',
          scientificTitle: 'Scientific Description of Test Trial',
          primarySponsor: 'Test Sponsor',
          recruitmentStatus: 'Recruiting',
          phase: 'Phase 2',
          studyType: 'Interventional',
          registerDate: '2023-01-01',
          countries: {
            country: 'United Kingdom'
          },
          conditions: {
            condition: ['Acute Myeloid Leukemia', 'Leukemia']
          },
          startDate: '2023-02-01',
          completionDate: '2025-12-31'
        }
      }
    };
    
    const result = formatTrialData(mockData);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    
    const trial = result[0];
    expect(trial.id).toBe('NCT12345678');
    expect(trial.title).toBe('Test Clinical Trial');
    expect(trial.primarySponsor).toBe('Test Sponsor');
    expect(trial.status).toBe('Recruiting');
    expect(trial.countries).toEqual(['United Kingdom']);
    expect(trial.conditions).toEqual(['Acute Myeloid Leukemia', 'Leukemia']);
  });
});
