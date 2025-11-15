require("dotenv").config();

const fs = require("fs");
const papa = require("papaparse");
const { start } = require("repl");
const xlsx = require("xlsx");

// Replace report fields to configure output
const previousReportDate = "11-03-2025";
const previousReportId = "BFzKR197D4aYXT6k";

const reportDate = "11-10-2025";
const reportId = "APJTRjxF64tZyfdH";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const authorizeUri = process.env.AUTHORIZE_URI;
const tokenUri = process.env.TOKEN_URI;

let token = "";

async function main() {
  await getWCLTOKEN();

  let rpb = await getFiles("RPB");
  // let cla = getFiles("CLA");
  let wcl = await getWCL(reportId);
  let previousWcl = await getWCL(previousReportId);

  let totalDamage = parseTotalDamage(wcl.table.data.damageDone);
  let previousTotalDamage = parseTotalDamage(previousWcl.table.data.damageDone);

  console.log(`Previous Total Damage for ${previousReportDate}: ${Number(previousTotalDamage).toLocaleString()}`);
  console.log(`Total Damage for ${reportDate}: ${Number(totalDamage).toLocaleString()}`);
  console.log(`Difference: ${Number(totalDamage - previousTotalDamage).toLocaleString()}`);

  let raidDps = calculateRaidDPS(totalDamage, wcl.fights);
  let previousRaidDps = calculateRaidDPS(previousTotalDamage, previousWcl.fights);

  console.log(
    `Previous Raid DPS for ${previousReportDate}: ${Number(previousRaidDps).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`,
  );
  console.log(`Raid DPS for ${reportDate}: ${Number(raidDps).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  console.log(
    `DPS Difference: ${Number(raidDps - previousRaidDps).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
  );
}

// Parses total damage from WCL and compares to previous Logs
function parseTotalDamage(damageTable) {
  let totalDamage = 0;

  for (let player of damageTable) {
    totalDamage += player.total;
  }

  return totalDamage;
}

function calculateRaidDPS(totalDamage, fights) {
  let totalTime = 0; //In milliseconds

  for (let fight of fights) {
    totalTime += fight.endTime - fight.startTime;
  }

  let dps = (totalDamage / totalTime) * 1000;

  return dps;
}

async function getFiles(dir) {
  const fileBuffer = fs.readFileSync(`${dir}/${reportDate}.xlsx`);
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  return data;
}

async function getWCLTOKEN() {
  let response = await fetch(`https://www.warcraftlogs.com/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
  }

  let results = await response.json();

  token = results.access_token;

  return;
}

async function getWCL(id) {
  let query = `
    query GetLogs($report_id: String!, $start_time: Float, $end_time: Float) {
      reportData {
        report(code: $report_id) {
          title
          zone {
            name
          }
          startTime
          endTime
          table(startTime: $start_time, endTime: $end_time)
          fights{
            name
            startTime
            endTime
          }
        }
      }
    }`;

  let response = await fetch(`https://www.warcraftlogs.com/api/v2/client`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { report_id: id, start_time: 0, end_time: 99999999999 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get WCL data: ${response.status} ${response.statusText}`);
  }

  let results = await response.json();

  return results.data.reportData.report;
}

main().catch((err) => {
  console.error(err);
});
