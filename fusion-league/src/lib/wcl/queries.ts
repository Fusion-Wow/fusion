import { gql } from 'graphql-request';

/**
 * Fetch all reports for a guild within a date range.
 */
export const GET_GUILD_REPORTS = gql`
	query GetGuildReports($guildName: String!, $serverSlug: String!, $serverRegion: String!, $startTime: Float!, $endTime: Float!) {
		reportData {
			reports(
				guildName: $guildName
				serverSlug: $serverSlug
				serverRegion: $serverRegion
				startTime: $startTime
				endTime: $endTime
			) {
				data {
					code
					title
					startTime
					endTime
					owner { name }
				}
			}
		}
	}
`;

/**
 * Fetch fights and actor list for a specific report.
 */
export const GET_REPORT_FIGHTS = gql`
	query GetReportFights($reportCode: String!) {
		reportData {
			report(code: $reportCode) {
				code
				title
				startTime
				endTime
				fights(killType: Kills) {
					id
					name
					kill
					startTime
					endTime
					friendlyPlayers
				}
				masterData {
					actors(type: "Player") {
						id
						name
						type
						subType
					}
				}
			}
		}
	}
`;

/**
 * Fetch parse rankings for all players in a report (spec-isolated).
 */
export const GET_REPORT_RANKINGS = gql`
	query GetReportRankings($reportCode: String!, $fightIDs: [Int]!) {
		reportData {
			report(code: $reportCode) {
				rankings(fightIDs: $fightIDs)
			}
		}
	}
`;

/**
 * Fetch player uptime / activity (casting + melee active time).
 */
export const GET_PLAYER_UPTIME = gql`
	query GetPlayerUptime($reportCode: String!, $fightIDs: [Int]!, $sourceID: Int!) {
		reportData {
			report(code: $reportCode) {
				table(
					fightIDs: $fightIDs
					sourceID: $sourceID
					dataType: Summary
					viewType: Activity
				)
			}
		}
	}
`;

/**
 * Fetch death events for a fight, with timestamps so we can apply
 * the wipe-forgiveness cutoff logic.
 */
export const GET_FIGHT_DEATHS = gql`
	query GetFightDeaths($reportCode: String!, $fightID: Int!) {
		reportData {
			report(code: $reportCode) {
				deaths: events(
					fightIDs: [$fightID]
					dataType: Deaths
				) {
					data
					nextPageTimestamp
				}
			}
		}
	}
`;

/**
 * Fetch debuff events — used for mechanic evaluation (e.g. Mag cube clicks).
 */
export const GET_DEBUFF_EVENTS = gql`
	query GetDebuffEvents($reportCode: String!, $fightID: Int!, $abilityID: Int!) {
		reportData {
			report(code: $reportCode) {
				events(
					fightIDs: [$fightID]
					dataType: Debuffs
					abilityID: $abilityID
				) {
					data
					nextPageTimestamp
				}
			}
		}
	}
`;

/**
 * Fetch damage-to-actors — used for Explosives scoring.
 * Filter for the Explosive mob NPC ID.
 */
export const GET_EXPLOSIVE_DAMAGE = gql`
	query GetExplosiveDamage($reportCode: String!, $fightIDs: [Int]!) {
		reportData {
			report(code: $reportCode) {
				table(
					fightIDs: $fightIDs
					dataType: DamageDone
					targetClass: NPC
				)
			}
		}
	}
`;
