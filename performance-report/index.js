require("dotenv").config();

const wclApiV2 = require("../wcl-v2/index.js");
const googleSheets = require("../google-sheets-v1/index.js");

let { abilityIds } = require("../wcl-v2/reference-ids.js");

const wclApi = new wclApiV2({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  reportId: "WKrVtyFf9a1pMcHd", //Need to replace with the wcl id from the sheet
});

const sheetApi = new googleSheets({
  email: process.env.EMAIL,
  key: process.env.KEY,
  spreadsheetId: process.env.SPREADSHEET_ID,
});

const configTabId = process.env.CONFIG_TAB_ID;

async function main() {
  await wclApi.getToken();

  let players = await compilePlayers();

  await compileExplosiveDamage(players);

  // let sheet = await getSheet();
  // let log = await getWCL();

  // await sheet.getRows();
  // console.log(log);
}

async function getSheet() {
  await sheetApi.getInfo();

  return sheetApi.doc;
}

async function getWCL() {
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
        fights {
          name
          startTime
          endTime
        }
      }
    }
  }`;

  let queryParams = {
    report_id: wclApi.reportId,
    start_time: 0,
    end_time: 99999999,
  };

  let logs = await wclApi.getLog(query, queryParams);

  return logs.reportData.report;
}

/**
 * Seems like WCL's api uses the playerDetails endpoint to return a list of players in a report
 * Their specs aren't sorted very well, players can be duplicated if they switched specs during the raid
 * We will prioritize assign their role based on the highest spec count
 */
async function compilePlayers() {
  let players = {};
  let playerDetails = await wclApi.getPlayers(wclApi.reportId);

  for (let role in playerDetails) {
    for (let player of playerDetails[role]) {
      //Grabs the spec with the highest count
      let specData = player.specs.reduce((a, b) => (a.count > b.count ? a : b));

      if (!players[player.id]) {
        players[player.id] = {
          id: player.id,
          name: player.name,
          class: player.type,
          role: role,
          spec: specData.spec,
          count: specData.count,
        };
      } else {
        let existingPlayer = players[player.id];

        if (specData.count > existingPlayer.count) {
          existingPlayer.spec = specData.spec;
          existingPlayer.count = specData.count;
          existingPlayer.role = role;
        }
      }
    }
  }

  return Object.values(players);
}

async function compileExplosiveDamage(players) {
  let explosiveAbilities = {
    "Goblin Sapper Charge": abilityIds["Goblin Sapper Charge"],
    "Dense Dynamite": abilityIds["Dense Dynamite"],
  };

  for (let abilityName in explosiveAbilities) {
    let abilityId = explosiveAbilities[abilityName];
    let damageData = await wclApi.getDamageDoneByAbility(wclApi.reportId, abilityId);

    for (let entry of damageData) {
      let player = players.find((p) => p.id === entry.id);
      let casts = await wclApi.getCastsByAbility(wclApi.reportId, abilityId, player.id, entry.startTime, entry.endTime);

      player[abilityName] = {
        totalDamage: entry.total,
        casts: casts,
      };
    }
  }

  console.log(players);
}

main().catch((err) => {
  console.error(err);
});
