const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

/**
 * @params options: Record<string, string> = {email: "", key: "", spreadsheetId: ""}
 */
class GoogleSheetsApiV1 {
  // Service Account Credentials - https://developers.google.com/workspace/guides/create-credentials#service-account-file
  options = {
    email: "",
    key: "",
    spreadsheetId: "", //The ID of the spreadsheet you want to access - This can be found in the Google Sheets URL
  };

  constructor(options) {
    this.email = options.email;
    this.key = options.key;
    this.spreadsheetId = options.spreadsheetId;

    const serviceAccountAuth = new JWT({
      email: this.email,
      key: this.key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.doc = new GoogleSpreadsheet(this.spreadsheetId, serviceAccountAuth);
  }

  async getInfo() {
    await this.doc.loadInfo();
    return this.doc;
  }

  async updateProperties(properties) {
    await this.doc.updateProperties(properties);
    return this.doc;
  }
}

module.exports = GoogleSheetsApiV1;
