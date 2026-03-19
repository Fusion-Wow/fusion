import "dotenv-safe/config.js";

import WclApiV2 from "../wcl-v2/index.js";
import { formatDuration, uniqueReports } from "./utils.js";
import { writeFileSync } from "fs";

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const CONFIG = {
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
};

const SERVER_SLUG = "nightslayer";
const SERVER_REGION = "us";

/**
 * It's important to check this rate limit — if it's too low, we may miss relevant logs and end up with an incomplete leaderboard.
 * Base it off the amount of weeks you are into the tier, and how many logs your anchor characters typically have per week.
 * For reference, with 20 logs per character, we can typically pull ~2 months of logs, which is sufficient for TBC as the tier lasted 4 months.
 * If you check too early in the tier and find that many teams are missing kills, consider increasing this limit and re-running the script.
 * Just be mindful of WCL's rate limits: https://www.warcraftlogs.com/v2-api-docs/#section/Authentication-and-Rate-Limits
 */
const REPORTS_PER_CHARACTER = 20;

/**
 * Z uses two anchor characters (one per split) — best kill from either counts.
 * All other teams use a single anchor character.
 */
const TEAMS = [
  { label: "Z", characters: ["Vert", "Twistqt"] },
  { label: "M", characters: ["Batfleck"] },
  { label: "Y", characters: ["Palantis"] },
  { label: "A", characters: ["Zandras"] },
  { label: "V", characters: ["Zathwiker"] },
  { label: "T", characters: ["Toemunches"] },
];

async function main() {
  if (!CONFIG.clientId || !CONFIG.clientSecret) {
    console.error("Error: WCL_CLIENT_ID and WCL_CLIENT_SECRET must be set.");
    console.error("  $env:WCL_CLIENT_ID='your_id'");
    console.error("  $env:WCL_CLIENT_SECRET='your_secret'");
    process.exit(1);
  }

  const api = new WclApiV2(CONFIG);

  console.log("Authenticating with WarcraftLogs...");
  await api.getToken();
  console.log("Authenticated.\n");

  const leaderboard = await buildLeaderboard(api);

  printLeaderboard(leaderboard);
  exportJson(leaderboard, "./leaderboard.json");
}

// ─────────────────────────────────────────────
//  CORE LOGIC
// ─────────────────────────────────────────────

/**
 * For a given team, fetches all recent reports across all anchor characters,
 * deduplicates, then returns the fastest kill per boss.
 *
 * @returns {Map<string, { durationMs, reportCode, reportTitle, reportUrl }>}
 */
async function getBestKillsForTeam(api, team) {
  const T4_BOSSES = new Set(["High King Maulgar", "Gruul the Dragonkiller", "Magtheridon"]);
  const bestKills = new Map();

  let allReports = [];
  for (const char of team.characters) {
    try {
      const reports = await api.getRecentReports(char, SERVER_SLUG, SERVER_REGION, REPORTS_PER_CHARACTER);
      allReports = allReports.concat(reports);
    } catch (err) {
      console.warn(`  ⚠ Could not fetch reports for ${char}: ${err.message}`);
    }
  }

  const reports = uniqueReports(allReports);
  if (reports.length === 0) {
    console.warn(`  ⚠ No reports found for team ${team.label}`);
    return bestKills;
  }

  for (const report of reports) {
    try {
      const fights = await api.getFights(report.code, true);

      for (const fight of fights.filter((f) => T4_BOSSES.has(f.name))) {
        const duration = fight.endTime - fight.startTime;
        const existing = bestKills.get(fight.name);

        if (!existing || duration < existing.durationMs) {
          bestKills.set(fight.name, {
            durationMs: duration,
            reportCode: report.code,
            reportTitle: report.title,
            reportUrl: `https://www.warcraftlogs.com/reports/${report.code}`,
          });
        }
      }
    } catch (err) {
      console.warn(`  ⚠ Could not fetch fights for report ${report.code}: ${err.message}`);
    }
  }

  return bestKills;
}

/**
 * Aggregates kills across all teams into a per-boss leaderboard.
 *
 * @returns {{ [bossName]: Array<{ rank, team, durationMs, formatted, reportUrl, reportTitle }> }}
 */
async function buildLeaderboard(api) {
  const teamResults = [];

  for (const team of TEAMS) {
    console.log(`Fetching logs for team ${team.label}...`);
    const bestKills = await getBestKillsForTeam(api, team);
    console.log(`  → ${bestKills.size} unique boss kills found`);
    teamResults.push({ label: team.label, bestKills });
  }

  const allBosses = new Set();
  for (const { bestKills } of teamResults) {
    for (const boss of bestKills.keys()) allBosses.add(boss);
  }

  const leaderboard = {};

  for (const boss of allBosses) {
    const entries = [];

    for (const { label, bestKills } of teamResults) {
      const kill = bestKills.get(boss);
      if (kill) {
        entries.push({
          team: label,
          durationMs: kill.durationMs,
          formatted: formatDuration(kill.durationMs),
          reportUrl: kill.reportUrl,
          reportTitle: kill.reportTitle,
        });
      }
    }

    // Sort fastest → slowest
    entries.sort((a, b) => a.durationMs - b.durationMs);

    // Assign ranks with tie support
    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i].durationMs > entries[i - 1].durationMs) {
        currentRank = i + 1;
      }
      entries[i].rank = currentRank;
    }

    leaderboard[boss] = entries;
  }

  return leaderboard;
}

// ─────────────────────────────────────────────
//  OUTPUT
// ─────────────────────────────────────────────

function printLeaderboard(leaderboard) {
  const bosses = Object.keys(leaderboard).sort();
  const medals = ["🥇", "🥈", "🥉"];

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║        FUSION — TBC SPEED LEADERBOARDS               ║");
  console.log(`║        ${new Date().toLocaleString().padEnd(46)}║`);
  console.log("╚══════════════════════════════════════════════════════╝");

  for (const boss of bosses) {
    const entries = leaderboard[boss];
    console.log(`\n  ⚔  ${boss}`);
    console.log("  " + "─".repeat(60));

    for (const entry of entries) {
      const rankLabels = ["#1", "#2", "#3"];
      const medal = rankLabels[entry.rank - 1] ?? `#${entry.rank}`;
      const team = entry.team.padEnd(4);
      const time = entry.formatted.padEnd(6);
      const url = entry.reportUrl.replace("www.warcraftlogs.com", "fresh.warcraftlogs.com");
      console.log(`  ${medal}  ${team}  ${time}  ${url}`);
    }

    const teamsWithKill = new Set(entries.map((e) => e.team));
    const missing = TEAMS.map((t) => t.label).filter((l) => !teamsWithKill.has(l));
    if (missing.length > 0) {
      console.log(`  ⬜  ${missing.join(", ")} — no kill recorded`);
    }

    console.log("  " + "─".repeat(60));
  }

  console.log("\n");
}

function exportJson(leaderboard, path) {
  writeFileSync(path, JSON.stringify(leaderboard, null, 2));
  console.log(`Leaderboard exported to ${path}`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
