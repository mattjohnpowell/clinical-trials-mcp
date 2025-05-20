# Clinical Trials MCP Server Testing Guide

This guide provides examples for testing the Clinical Trials MCP server functionality.

## API Considerations

The ICTRP API has some limitations that users should be aware of:

1. **Parameter Sensitivity**: The API requires specific parameter formats. For example, it uses `country` not `countries`.
2. **Location Limitations**: City-level searches may not work directly. When searching for trials in a specific city, use the `query` parameter.
3. **Fallback Mechanism**: The server now attempts to fall back to broader searches when specific searches fail.
4. **Error Handling**: More detailed error messages are provided to help troubleshoot failed searches.

## Sample Queries for Testing

### Search Clinical Trials Tool

1. **Basic keyword search:**
   ```json
   {
     "query": "diabetes"
   }
   ```

2. **Search by condition and country:**
   ```json
   {
     "condition": "breast cancer",
     "country": "Germany"
   }
   ```

3. **Search by sponsor:**
   ```json
   {
     "sponsor": "Novartis"
   }
   ```

4. **Search by phase:**
   ```json
   {
     "phase": "Phase 3",
     "condition": "COVID-19"
   }
   ```

5. **Search with date range:**
   ```json
   {
     "condition": "Alzheimer",
     "dateFrom": "2020-01-01",
     "dateTo": "2023-12-31"
   }
   ```

6. **Search with recruitment status:**
   ```json
   {
     "condition": "lung cancer",
     "recruitmentStatus": "Recruiting",
     "maxResults": 5
   }
   ```

### Get Trial Details Tool

1. **Retrieve trial by ID:**
   ```json
   {
     "trialId": "NCT04368728"
   }
   ```

2. **Another trial ID example:**
   ```json
   {
     "trialId": "EUCTR2020-001038-36"
   }
   ```

## Testing with Claude for Desktop

When testing with Claude for Desktop, you can use natural language queries such as:

1. "Find clinical trials for diabetes in the United States"
2. "What clinical trials are recruiting patients for lung cancer in Europe?"
3. "Show me details for clinical trial NCT04368728"
4. "Are there any Phase 3 trials for COVID-19 vaccines?"
5. "What clinical trials is Novartis currently sponsoring for cancer treatments?"

## Troubleshooting

If you encounter issues during testing:

1. **Check server logs** for error messages
2. Verify the **ICTRP API** is accessible
3. **Confirm parameter formatting** is correct (especially dates in YYYY-MM-DD format)
4. Check that your **MCP client configuration** is pointing to the correct file path
5. Try **restarting the server** using `npm run dev`
