/**
 * @params options: Record<string, string> = {clientId: "", clientSecret: "", reportId: ""}
 */
class WclApiV2 {
  // OAuth2 Credentials - https://www.warcraftlogs.com/api/clients/
  options = {
    clientId: "",
    clientSecret: "",
    reportId: "", //The report code you want to query - this can be found in the wcl URL
  };

  authorizeUri = "https://www.warcraftlogs.com/oauth/token";
  token = ""; //Acquired from submitting your clientId and clientSecret to the authorizeUri

  constructor(options) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.reportId = options.reportId;
  }

  async getToken() {
    let response = await fetch(this.authorizeUri, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grant_type: "client_credentials" }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
    }

    let results = await response.json();

    this.token = results.access_token;

    return;
  }

  async getLog(query, queryParams = {}) {
    let response = await fetch(`https://www.warcraftlogs.com/api/v2/client`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: queryParams,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get WCL data: ${response.status} ${response.statusText}`);
    }

    let results = await response.json();

    return results.data;
  }
}

module.exports = WclApiV2;
