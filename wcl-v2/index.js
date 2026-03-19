class WclApiV2 {
  authorizeUri = "https://fresh.warcraftlogs.com/oauth/token";
  token = "";

  constructor(options) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
  }

  async getToken() {
    const response = await fetch(this.authorizeUri, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grant_type: "client_credentials" }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    this.token = results.access_token;
  }

  async getLog(query, queryParams = {}) {
    const response = await fetch("https://fresh.warcraftlogs.com/api/v2/client", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: queryParams }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get WCL data: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    return results.data;
  }

  async getRecentReports(characterName, serverSlug, serverRegion, limit = 5) {
    const query = `
    query GetRecentReports(
      $character_name: String!,
      $server_slug: String!,
      $server_region: String!,
      $limit: Int!
    ) {
      characterData {
        character(
          name: $character_name,
          serverSlug: $server_slug,
          serverRegion: $server_region
        ) {
          recentReports(limit: $limit) {
            data {
              code
              title
              startTime
              endTime
            }
          }
        }
      }
    }`;

    const response = await this.getLog(query, {
      character_name: characterName,
      server_slug: serverSlug,
      server_region: serverRegion,
      limit,
    });

    const char = response?.characterData?.character;
    if (!char) throw new Error(`Character not found: ${characterName}-${serverSlug}`);

    return char.recentReports.data;
  }

  async getFights(reportId, killsOnly = false) {
    const query = `
    query GetFights($report_id: String!) {
      reportData {
        report(code: $report_id) {
          fights(killType: ${killsOnly ? "Kills" : "All"}) {
            id
            name
            startTime
            endTime
            kill
            difficulty
            bossPercentage
          }
        }
      }
    }`;

    const response = await this.getLog(query, { report_id: reportId });

    const fights = response?.reportData?.report?.fights;
    if (!fights) throw new Error(`Could not fetch fights for report: ${reportId}`);

    // Filter out trash/non-boss fights
    return fights.filter((f) => f.difficulty != null);
  }

  async getPlayers(reportId, startTime = 0, endTime = 99999999) {
    const query = `
    query GetLogs($report_id: String!, $start_time: Float!, $end_time: Float!) {
      reportData {
        report(code: $report_id) {
          playerDetails(startTime: $start_time, endTime: $end_time)
        }
      }
    }`;

    const response = await this.getLog(query, {
      report_id: reportId,
      start_time: startTime,
      end_time: endTime,
    });

    return response.reportData.report.playerDetails.data.playerDetails;
  }

  async getDamageDoneByAbility(reportId, abilityId, startTime = 0, endTime = 99999999) {
    const query = `
    query GetAbilityDamage($report_id: String!, $ability_id: Float!, $start_time: Float!, $end_time: Float!) {
      reportData {
        report(code: $report_id) {
          table(
            startTime: $start_time,
            endTime: $end_time,
            dataType: DamageDone,
            abilityID: $ability_id,
          )
        }
      }
    }`;

    const response = await this.getLog(query, {
      report_id: reportId,
      ability_id: abilityId,
      start_time: startTime,
      end_time: endTime,
    });

    return response.reportData.report.table.data.entries;
  }

  async getCastsByAbility(reportId, abilityId, sourceId, startTime = 0, endTime = 99999999) {
    const query = `
    query GetCasts(
      $report_id: String!,
      $ability_id: Float!,
      $source_id: Int!,
      $start_time: Float!,
      $end_time: Float!
    ) {
      reportData {
        report(code: $report_id) {
          events(
            dataType: Casts
            startTime: $start_time
            endTime: $end_time
            abilityID: $ability_id
            sourceID: $source_id
          ) {
            data
          }
        }
      }
    }`;

    const response = await this.getLog(query, {
      report_id: reportId,
      ability_id: abilityId,
      source_id: sourceId,
      start_time: startTime,
      end_time: endTime,
    });

    let casts = 0;
    for (const cast of response.reportData.report.events.data) {
      if (cast.type === "cast") casts++;
    }
    return casts;
  }
}

export default WclApiV2;
