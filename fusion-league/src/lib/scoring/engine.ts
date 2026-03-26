import type {
	PlayerWeekScore,
	ScoreBreakdown,
	MechanicBreakdown,
	DeathBreakdown,
	MechanicDefinition
} from '$lib/types';

// ─── Weights ──────────────────────────────────────────────────────────────────

export const SCORE_WEIGHTS = {
	parse: 0.30,
	activity: 0.10,
	mechanic: 0.30,
	death: 0.20,
	explosive: 0.10
} as const;

// ─── Death Scoring ────────────────────────────────────────────────────────────

/**
 * How many players dying within a short window constitutes a "wipe event."
 * Deaths at or after this threshold in a single fight are forgiven for
 * everyone in that fight (they were wiping intentionally to reset).
 */
export const WIPE_DEATH_THRESHOLD = 5;
export const WIPE_WINDOW_MS = 10_000; // 10 seconds

export interface RawDeathEvent {
	timestamp: number;
	sourceID: number; // actor ID
	targetID: number; // should equal sourceID for player deaths
	fightID: number;
}

/**
 * Given all death events across fights, return per-player counted deaths
 * after applying wipe-forgiveness logic.
 *
 * Logic:
 * - Within each fight, scan death events in time order.
 * - If >= WIPE_DEATH_THRESHOLD players die within WIPE_WINDOW_MS, that is a
 *   wipe event. All deaths at or after the first death in that window are
 *   forgiven (not counted) for every player in the fight.
 * - Only the first such wipe window per fight triggers forgiveness;
 *   subsequent wipe windows in the same fight are also forgiven.
 */
export function calculateDeathScores(
	deathEvents: RawDeathEvent[],
	playerActorIds: Set<number>
): Map<number, DeathBreakdown> {
	// Group deaths by fight
	const byFight = new Map<number, RawDeathEvent[]>();
	for (const e of deathEvents) {
		if (!byFight.has(e.fightID)) byFight.set(e.fightID, []);
		byFight.get(e.fightID)!.push(e);
	}

	// Per player: track raw vs counted
	const playerDeaths = new Map<number, { raw: number; counted: number; forgiven: number }>();
	for (const id of playerActorIds) {
		playerDeaths.set(id, { raw: 0, counted: 0, forgiven: 0 });
	}

	for (const [, fightDeaths] of byFight) {
		fightDeaths.sort((a, b) => a.timestamp - b.timestamp);

		// Find all wipe windows in this fight
		const wipeWindowStarts: number[] = [];
		for (let i = 0; i < fightDeaths.length; i++) {
			const windowEnd = fightDeaths[i].timestamp + WIPE_WINDOW_MS;
			const inWindow = fightDeaths.filter(
				(d) => d.timestamp >= fightDeaths[i].timestamp && d.timestamp <= windowEnd
			);
			if (inWindow.length >= WIPE_DEATH_THRESHOLD) {
				wipeWindowStarts.push(fightDeaths[i].timestamp);
			}
		}

		for (const death of fightDeaths) {
			const actorId = death.targetID;
			if (!playerActorIds.has(actorId)) continue;

			const player = playerDeaths.get(actorId)!;
			player.raw++;

			// Is this death inside a wipe window?
			const inWipe = wipeWindowStarts.some(
				(start) => death.timestamp >= start && death.timestamp <= start + WIPE_WINDOW_MS
			);

			if (inWipe) {
				player.forgiven++;
			} else {
				player.counted++;
			}
		}
	}

	// Convert to DeathBreakdown
	const result = new Map<number, DeathBreakdown>();
	for (const [id, d] of playerDeaths) {
		result.set(id, {
			raw_deaths: d.raw,
			counted_deaths: d.counted,
			wipes_forgiven: d.forgiven
		});
	}
	return result;
}

/**
 * Convert counted deaths to a 0–100 score.
 * 0 deaths = 100, each death reduces score by 20 (floor 0).
 */
export function deathBreakdownToScore(breakdown: DeathBreakdown): number {
	return Math.max(0, 100 - breakdown.counted_deaths * 20);
}

// ─── Mechanic Scoring ────────────────────────────────────────────────────────

export interface DebuffEvent {
	timestamp: number;
	targetID: number;
	type: 'applydebuff' | 'removedebuff';
}

/**
 * Score a player's performance on a debuff_timing mechanic (e.g. Mag cube).
 * Evaluates sync with group median AND hold duration.
 */
export function scoreCubeMechanic(
	mechanic: MechanicDefinition,
	playerActorId: number,
	debuffEvents: DebuffEvent[],
	expectedDurationMs: number = 6000 // Shadow Grasp is 6s
): MechanicBreakdown {
	const applyEvents = debuffEvents.filter((e) => e.type === 'applydebuff');
	const removeEvents = debuffEvents.filter((e) => e.type === 'removedebuff');

	// Find this player's apply event
	const playerApply = applyEvents.find((e) => e.targetID === playerActorId);
	const playerRemove = removeEvents.find((e) => e.targetID === playerActorId);

	if (!playerApply) {
		return {
			mechanic_id: mechanic.id,
			boss: mechanic.boss,
			mechanic_name: mechanic.name,
			score: mechanic.scoring.fail_score ?? 0,
			passed: false,
			details: { reason: 'Player never clicked cube' }
		};
	}

	// Group median click time
	const allClickTimes = applyEvents.map((e) => e.timestamp).sort((a, b) => a - b);
	const medianClick = allClickTimes[Math.floor(allClickTimes.length / 2)];
	const syncDelta = Math.abs(playerApply.timestamp - medianClick);
	const inSync = syncDelta <= (mechanic.scoring.sync_tolerance_ms ?? 2500);

	// Hold duration
	const holdDuration = playerRemove
		? playerRemove.timestamp - playerApply.timestamp
		: expectedDurationMs; // assume full hold if no remove event found
	const holdPercent = Math.min(100, (holdDuration / expectedDurationMs) * 100);

	// Score via tiers
	const effectivePercent = inSync ? holdPercent : holdPercent * 0.5; // penalize out-of-sync
	const tiers = mechanic.scoring.tiers ?? [];
	let score = mechanic.scoring.fail_score ?? 0;
	for (const tier of tiers.sort((a, b) => b.min_percent - a.min_percent)) {
		if (effectivePercent >= tier.min_percent) {
			score = tier.score;
			break;
		}
	}

	return {
		mechanic_id: mechanic.id,
		boss: mechanic.boss,
		mechanic_name: mechanic.name,
		score,
		passed: score >= 75,
		details: {
			sync_delta_ms: syncDelta,
			in_sync: inSync,
			hold_duration_ms: holdDuration,
			hold_percent: holdPercent,
			effective_percent: effectivePercent
		}
	};
}

// ─── Final Score Aggregation ──────────────────────────────────────────────────

export function computeTotalScore(breakdown: ScoreBreakdown): number {
	const mechanicAvg =
		breakdown.mechanics.length > 0
			? breakdown.mechanics.reduce((sum, m) => sum + m.score, 0) / breakdown.mechanics.length
			: 100; // no mechanics for this week = full marks

	return Math.round(
		breakdown.parse.percentile * SCORE_WEIGHTS.parse +
		breakdown.activity.uptime_percent * SCORE_WEIGHTS.activity +
		mechanicAvg * SCORE_WEIGHTS.mechanic +
		deathBreakdownToScore(breakdown.deaths) * SCORE_WEIGHTS.death +
		Math.min(100, breakdown.explosives.total_damage / 1000) * SCORE_WEIGHTS.explosive
		// ↑ explosive scale TBD — adjust divisor based on real data
	);
}
