// ─── Discord / Auth ───────────────────────────────────────────────────────────

export type DiscordRole =
	| 'TBC Leads'
	| 'TBC RAID Z'
	| 'TBC RAID M'
	| 'TBC RAID T'
	| 'TBC RAID Y'
	| 'TBC RAID V'
	| 'TBC RAID A'
	| 'Social';

export type AccessLevel = 'admin' | 'picker' | 'viewer' | 'blocked';

export function resolveAccessLevel(roles: DiscordRole[]): AccessLevel {
	if (roles.includes('TBC Leads')) return 'admin';
	if (
		roles.some((r) =>
			(['TBC RAID Z', 'TBC RAID M', 'TBC RAID T', 'TBC RAID Y', 'TBC RAID V', 'TBC RAID A'] as DiscordRole[]).includes(r)
		)
	)
		return 'picker';
	if (roles.includes('Social')) return 'viewer';
	return 'blocked';
}

// ─── WoW Player ───────────────────────────────────────────────────────────────

export type WowClass =
	| 'Warrior'
	| 'Paladin'
	| 'Hunter'
	| 'Rogue'
	| 'Priest'
	| 'Shaman'
	| 'Mage'
	| 'Warlock'
	| 'Druid';

export type WowRole = 'tank' | 'healer' | 'dps';

export type RaidTeam = 'Z' | 'M' | 'T' | 'Y' | 'V' | 'A';

export interface GuildPlayer {
	id: string;
	character_name: string;
	class: WowClass;
	spec: string;
	role: WowRole;
	team: RaidTeam;
	active: boolean;
	wcl_id?: string; // WarcraftLogs actor ID if known
}

// ─── Week / Season ────────────────────────────────────────────────────────────

export type WeekStatus = 'upcoming' | 'open' | 'locked' | 'scoring' | 'complete';

export interface Week {
	id: string;
	week_number: number;
	reset_date: string;       // ISO — Tuesday reset
	picks_open_at: string;    // Tuesday 8am EST
	picks_close_at: string;   // Tuesday 8pm EST
	status: WeekStatus;
	winner_user_id?: string;
	winner_announced_at?: string;
}

// ─── Picks ────────────────────────────────────────────────────────────────────

export interface FantasyPick {
	id: string;
	user_id: string;
	week_id: string;
	tank_id: string;
	healer_id: string;
	dps1_id: string;
	dps2_id: string;
	dps3_id: string;
	locked: boolean;
	submitted_at: string;
}

export interface FantasyRoster {
	tank: GuildPlayer;
	healer: GuildPlayer;
	dps: [GuildPlayer, GuildPlayer, GuildPlayer];
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface PlayerWeekScore {
	id: string;
	player_id: string;
	week_id: string;

	// Raw scores (0–100 scale each)
	parse_score: number;       // 30% weight
	activity_score: number;    // 10% weight
	mechanic_score: number;    // 30% weight
	death_score: number;       // 20% weight
	explosive_score: number;   // 10% weight

	// Computed
	total_score: number;       // weighted sum
	score_breakdown: ScoreBreakdown;

	computed_at: string;
}

export interface ScoreBreakdown {
	parse: ParseBreakdown;
	activity: ActivityBreakdown;
	mechanics: MechanicBreakdown[];
	deaths: DeathBreakdown;
	explosives: ExplosiveBreakdown;
}

export interface ParseBreakdown {
	percentile: number;
	class: WowClass;
	spec: string;
	boss_parses: { boss: string; percentile: number }[];
}

export interface ActivityBreakdown {
	uptime_percent: number;
	active_time_ms: number;
	total_fight_time_ms: number;
}

export interface DeathBreakdown {
	raw_deaths: number;
	counted_deaths: number; // after wipe-forgiveness cutoff
	wipes_forgiven: number;
}

export interface ExplosiveBreakdown {
	total_damage: number;
	hit_count: number;
}

// ─── Mechanics ────────────────────────────────────────────────────────────────

export type MechanicType = 'debuff_timing' | 'debuff_duration' | 'position' | 'cast' | 'custom';

/**
 * Defines how to evaluate a mechanic for a given boss.
 * New bosses/mechanics are added here without changing core scoring logic.
 */
export interface MechanicDefinition {
	id: string;
	boss: string;           // e.g. "Magtheridon"
	name: string;           // e.g. "Cube Click"
	type: MechanicType;
	description: string;

	// WCL event filter to identify this mechanic
	wcl_filter: WCLMechanicFilter;

	// How to score it
	scoring: MechanicScoringRule;
}

export interface WCLMechanicFilter {
	// For debuff-based mechanics (like Mag cube)
	debuff_id?: number;         // spell/aura ID in WCL
	debuff_name?: string;       // human-readable fallback
	event_type?: 'applydebuff' | 'removedebuff' | 'cast' | 'damage' | 'heal';
}

export interface MechanicScoringRule {
	// Timing-based: how close to the group median click (ms tolerance)
	sync_tolerance_ms?: number;
	// Duration-based: what % of expected duration they must hold
	min_hold_percent?: number;
	// Partial credit tiers
	tiers?: {
		min_percent: number;
		score: number; // 0–100
	}[];
	// Simple pass/fail fallback
	pass_score?: number;
	fail_score?: number;
}

export interface MechanicBreakdown {
	mechanic_id: string;
	boss: string;
	mechanic_name: string;
	score: number;
	passed: boolean;
	details: Record<string, unknown>; // mechanic-specific detail bag
}

// ─── Fantasy Team Score (aggregated for leaderboard) ─────────────────────────

export interface FantasyTeamScore {
	user_id: string;
	display_name: string;
	discord_avatar?: string;
	week_id: string;
	total_score: number;
	player_scores: {
		player: GuildPlayer;
		score: PlayerWeekScore;
	}[];
	rank: number;
}
