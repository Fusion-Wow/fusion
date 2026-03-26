<script lang="ts">
  import type { PageData } from "./$types";
  import type { GuildPlayer } from "$lib/types";

  const { data }: { data: any } = $props();

  type Player = GuildPlayer & { id: string };

  // svelte-ignore state_referenced_locally
  const tanks = (data.players as Player[]).filter((p) => p.role === "tank");
  const healers = (data.players as Player[]).filter((p) => p.role === "healer");
  const dps = (data.players as Player[]).filter((p) => p.role === "dps");

  let picksStatus = $state(data.picksOpen ? "open" : "closed");
  let leaderboard = $state(data.leaderboard ?? []);

  // svelte-ignore state_referenced_locally
  let selectedTank = $state(data.existingPick?.tank_id ?? "");
  // svelte-ignore state_referenced_locally
  let selectedHealer = $state(data.existingPick?.healer_id ?? "");
  let selectedDps = $state([
    data.existingPick?.dps1_id ?? "",
    data.existingPick?.dps2_id ?? "",
    data.existingPick?.dps3_id ?? "",
  ]);

  let locked = $state(data.existingPick?.locked ?? false);
  let errorMsg = $state("");

  function toggleDps(id: string) {
    if (selectedDps.includes(id)) {
      selectedDps = selectedDps.map((d) => (d === id ? "" : d));
    } else {
      const emptySlot = selectedDps.findIndex((d) => d === "");
      if (emptySlot >= 0) selectedDps[emptySlot] = id;
    }
  }

  const rosterComplete = $derived(selectedTank && selectedHealer && selectedDps.filter(Boolean).length === 3);
  const selectedDpsSet = $derived(new Set(selectedDps.filter(Boolean)));
</script>

<svelte:head>
  <title>Fusion League — Leaderboard</title>
</svelte:head>

<div class="page">
  <header class="page-header">
    <h1>⚡ Fusion League</h1>
    {#if data.week}
      <p class="week-label">
        Week {data.week.week_number} — Reset {new Date(data.week.reset_date).toLocaleDateString()}
      </p>
      <span class="status-badge status--{data.week.status}">{data.week.status}</span>
    {:else}
      <p class="week-label">No active week yet.</p>
    {/if}
  </header>

  {#if data.week?.winner_user_id}
    <div class="winner-banner">🏆 This week's winner has been announced!</div>
  {/if}

  <div class="picks-window">
    {#if picksStatus === "open"}
      <span class="pill pill--open">🟢 Picks window is open</span>
      <a href="/picks" class="cta-btn">Make your picks →</a>
    {:else if picksStatus === "before"}
      <span class="pill pill--waiting">⏳ Picks open Tuesday 8am EST</span>
    {:else}
      <span class="pill pill--closed">🔒 Picks are locked</span>
    {/if}
  </div>

  {#if leaderboard.length === 0}
    <p class="empty">No picks submitted yet for this week.</p>
  {:else}
    <table class="leaderboard">
      <thead>
        <tr>
          <th>#</th>
          <th>Manager</th>
          <th>Tank</th>
          <th>Healer</th>
          <th>DPS</th>
          <th>Score</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {#each leaderboard as entry, i}
          <tr class:row--top={i === 0}>
            <td class="rank">{i + 1}</td>
            <td class="user">{entry.user_id}</td>
            <td>{entry.roster[0]?.character_name ?? "—"}</td>
            <td>{entry.roster[1]?.character_name ?? "—"}</td>
            <td>
              {entry.roster[2]?.character_name ?? "—"},
              {entry.roster[3]?.character_name ?? "—"},
              {entry.roster[4]?.character_name ?? "—"}
            </td>
            <td class="score">{entry.total_score.toFixed(1)}</td>
            <td>
              {#if entry.locked}
                <span class="pill pill--locked">Locked</span>
              {:else}
                <span class="pill pill--draft">Draft</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .page-header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    flex-wrap: wrap;
  }
  h1 {
    font-size: 2rem;
    color: #f0c040;
  }
  .week-label {
    color: #888;
    font-size: 0.9rem;
  }

  .status-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .status--open {
    background: #1a6b3c;
    color: #80ffaa;
  }
  .status--locked {
    background: #6b4a1a;
    color: #ffcc80;
  }
  .status--scoring {
    background: #1a3a6b;
    color: #80aaff;
  }
  .status--complete {
    background: #3a3a4a;
    color: #a0a0b0;
  }

  .winner-banner {
    background: linear-gradient(90deg, #7b3fe4, #f0c040);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: bold;
  }

  .picks-window {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .pill {
    font-size: 0.8rem;
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    display: inline-block;
  }
  .pill--open {
    background: #1a6b3c22;
    border: 1px solid #1a6b3c;
    color: #80ffaa;
  }
  .pill--waiting {
    background: #3a3a1a22;
    border: 1px solid #6b6b1a;
    color: #ffff80;
  }
  .pill--closed {
    background: #3a1a1a22;
    border: 1px solid #6b1a1a;
    color: #ffaaaa;
  }
  .pill--locked {
    background: #6b4a1a22;
    border: 1px solid #6b4a1a;
    color: #ffcc80;
  }
  .pill--draft {
    background: #1a1a3a22;
    border: 1px solid #3a3a6b;
    color: #aaaaff;
  }

  .cta-btn {
    background: #f0c040;
    color: #0d0d0f;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .leaderboard {
    width: 100%;
    border-collapse: collapse;
  }
  .leaderboard th {
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid #2a2a35;
    color: #888;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .leaderboard td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #1a1a25;
    font-size: 0.9rem;
  }
  .row--top td {
    color: #f0c040;
  }
  .rank {
    font-weight: bold;
    color: #f0c040;
  }
  .score {
    font-weight: bold;
    font-size: 1rem;
  }
  .empty {
    color: #555;
    text-align: center;
    padding: 3rem;
  }
</style>
