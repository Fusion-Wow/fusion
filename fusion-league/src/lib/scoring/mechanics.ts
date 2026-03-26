import type { MechanicDefinition } from '$lib/types';

/**
 * Registry of all mechanic definitions.
 * Add new boss mechanics here — no changes needed to core scoring engine.
 *
 * To add a mechanic:
 * 1. Find the debuff/spell ID in WarcraftLogs for that event
 * 2. Define the WCL filter and scoring rule
 * 3. Push to this array
 */
export const MECHANIC_DEFINITIONS: MechanicDefinition[] = [
	{
		id: 'mag_cube_click',
		boss: 'Magtheridon',
		name: 'Cube Click',
		type: 'debuff_timing',
		description:
			'Player must click a Cube of Force at the correct time (in sync with group) and hold the channel for its full duration.',

		wcl_filter: {
			debuff_id: 30282, // Shadow Grasp — the debuff applied when channeling a cube
			debuff_name: 'Shadow Grasp',
			event_type: 'applydebuff'
		},

		scoring: {
			// How close to the median group click time the player must be
			sync_tolerance_ms: 2500,

			// What % of the full channel duration (6s) they must hold
			min_hold_percent: 80,

			// Partial credit tiers (score out of 100)
			tiers: [
				{ min_percent: 100, score: 100 }, // Perfect: in sync AND full duration
				{ min_percent: 80, score: 75 },   // Good: in sync, slightly short
				{ min_percent: 50, score: 40 },   // Partial: clicked but broke early
				{ min_percent: 0, score: 0 }       // Failed: too late or never clicked
			],

			pass_score: 100,
			fail_score: 0
		}
	}

	// Future mechanics go here, e.g.:
	// {
	//   id: 'gruul_shatter_position',
	//   boss: "Gruul's Lair - Gruul",
	//   name: 'Shatter Positioning',
	//   ...
	// }
];

export function getMechanicsByBoss(boss: string): MechanicDefinition[] {
	return MECHANIC_DEFINITIONS.filter((m) => m.boss === boss);
}

export function getMechanicById(id: string): MechanicDefinition | undefined {
	return MECHANIC_DEFINITIONS.find((m) => m.id === id);
}
