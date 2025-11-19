# Warcraft Logs API Wrapper

This code is an attempt to make an easy to use abstraction for running queries using Warcraft Logs GraphQL API.

Additional information can be found at Warcraft Log's API V2 documentation:

- Acquiring clientID/clientSecret: https://www.warcraftlogs.com/api/docs
- GraphQL API Documentation: https://www.warcraftlogs.com/v2-api-docs/warcraft/

### TODO

- Build integrated pagination features

### Class

```javascript
WclApiV2(options: {
  clientId: String,
  clientSecret: String,
  reportId: String, //The report code you want to query - this can be found in the wcl URL
})
```

#### Class Methods

```javascript
wclApiv2.getLog(
  query: String, //GraphQL String
  queryParams: Record<string,any>(Optional), //Additional variables for searching/filtering results
)
```
