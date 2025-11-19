# Google Sheets API Wrapper

This code is an attempt to make an easy to use abstraction for running queries using Google Sheets API, while
integrating google-spreadsheets library to streamline the functionality for the user.

Additional information can be found here:

- Google Sheets API: https://developers.google.com/workspace/sheets/api/guides/concepts
- Google-Spreadsheet NPM: https://www.npmjs.com/package/google-spreadsheet

### TODO

- Compile List of properties options for updateProperties method
- Build integrated pagination features
- Continue building helper functions
  - Update Specific Cells
    - Option for Cell Ranges
  - Adjust styling
    - Color, borders, etc.
  - Inject pivot tables, graphs, etc

### Class

```javascript
GoogleSheetsApiV1(options: {
  email: String,
  key: String,
  spreadsheetId: String, //The report code you want to query - this can be found in the Google Sheet's URL
})
```

#### Class Methods

```javascript
// loads document properties and worksheets
googleSheetsApiV1.getInfo();
```

```javascript
googleSheetsApiV1.updateProperties(
  properties: Record<string,any> //i.e. updating Title
);
```
