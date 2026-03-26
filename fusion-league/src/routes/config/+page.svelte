<script lang="ts">
  import type { PageData } from "./$types";
  import type { GuildPlayer } from "$lib/types";

  const { data }: { data: any } = $props();

  type Player = GuildPlayer & { id: string };

  const WOW_CLASSES = ["Warrior", "Paladin", "Hunter", "Rogue", "Priest", "Shaman", "Mage", "Warlock", "Druid"];
  const ROLES = ["tank", "healer", "dps"];
  const TEAMS = ["Z", "M", "T", "Y", "V", "A"];

  let tab = $state<"players" | "weeks" | "mechanics">("players");
  let editingPlayer = $state<Partial<Player> | null>(null);
  let showAddPlayer = $state(false);

  function startEdit(p: Player) {
    editingPlayer = { ...p };
  }
  function cancelEdit() {
    editingPlayer = null;
    showAddPlayer = false;
  }
</script>

<svelte:head><title>Fusion League — Config</title></svelte:head>

<div class="page">
  <h1>⚙️ Config</h1>
  <p class="sub">TBC Leads access only.</p>

  <div class="tabs">
    <button class:active={tab === "players"} onclick={() => (tab = "players")}>Players</button>
    <button class:active={tab === "weeks"} onclick={() => (tab = "weeks")}>Weeks</button>
    <button class:active={tab === "mechanics"} onclick={() => (tab = "mechanics")}>Mechanics</button>
  </div>

  {#if tab === "players"}
    <div class="tab-content">
      <div class="tab-header">
        <h2>Player Roster</h2>
        <button class="btn-primary" onclick={() => (showAddPlayer = true)}>+ Add Player</button>
      </div>

      {#if showAddPlayer || editingPlayer}
        <form method="POST" action="?/upsertPlayer" class="player-form">
          {#if editingPlayer?.id}
            <input type="hidden" name="id" value={editingPlayer.id} />
          {/if}
          <div class="form-grid">
            <label>Name<input name="character_name" value={editingPlayer?.character_name ?? ""} required /></label>
            <label
              >Class
              <select name="class">
                {#each WOW_CLASSES as c}<option value={c}>{c}</option>{/each}
              </select>
            </label>
            <label>Spec<input name="spec" value={editingPlayer?.spec ?? ""} /></label>
            <label
              >Role
              <select name="role">
                {#each ROLES as r}<option value={r}>{r}</option>{/each}
              </select>
            </label>
            <label
              >Team
              <select name="team">
                {#each TEAMS as t}<option value={t}>{t}</option>{/each}
              </select>
            </label>
            <label>WCL Actor Name<input name="wcl_id" value={editingPlayer?.wcl_id ?? ""} /></label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Save</button>
            <button type="button" onclick={cancelEdit}>Cancel</button>
          </div>
        </form>
      {/if}

      <table class="data-table">
        <thead>
          <tr><th>Name</th><th>Class / Spec</th><th>Role</th><th>Team</th><th>WCL ID</th><th>Active</th><th></th></tr>
        </thead>
        <tbody>
          {#each data.players as p (p.id)}
            <tr class:inactive={!p.active}>
              <td>{p.character_name}</td>
              <td>{p.spec} {p.class}</td>
              <td><span class="role-badge role--{p.role}">{p.role}</span></td>
              <td>{p.team}</td>
              <td class="mono">{p.wcl_id ?? "—"}</td>
              <td>
                <form method="POST" action="?/togglePlayer" style="display:inline">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="active" value={String(!p.active)} />
                  <button type="submit" class="btn-sm">{p.active ? "Deactivate" : "Activate"}</button>
                </form>
              </td>
              <td><button class="btn-sm" onclick={() => startEdit(p as Player)}>Edit</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if tab === "weeks"}
    <div class="tab-content">
      <h2>Weeks</h2>
      <form method="POST" action="?/createWeek" class="player-form">
        <div class="form-grid">
          <label>Week Number<input type="number" name="week_number" min="1" required /></label>
          <label>Reset Date (Tuesday)<input type="date" name="reset_date" required /></label>
        </div>
        <button type="submit" class="btn-primary">Create Week</button>
      </form>
      <table class="data-table">
        <thead>
          <tr><th>#</th><th>Reset Date</th><th>Status</th><th>Advance</th></tr>
        </thead>
        <tbody>
          {#each data.weeks as w (w.id)}
            <tr>
              <td>{w.week_number}</td>
              <td>{w.reset_date}</td>
              <td><span class="status-badge status--{w.status}">{w.status}</span></td>
              <td>
                {#if w.status !== "complete"}
                  <form method="POST" action="?/advanceWeekStatus" style="display:inline">
                    <input type="hidden" name="id" value={w.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={w.status === "upcoming"
                        ? "open"
                        : w.status === "open"
                          ? "locked"
                          : w.status === "locked"
                            ? "scoring"
                            : "complete"}
                    />
                    <button type="submit" class="btn-sm btn-advance"
                      >→ {w.status === "upcoming"
                        ? "Open"
                        : w.status === "open"
                          ? "Lock"
                          : w.status === "locked"
                            ? "Score"
                            : "Complete"}</button
                    >
                  </form>
                {:else}
                  <span>✓</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if tab === "mechanics"}
    <div class="tab-content">
      <h2>Mechanic Definitions</h2>
      <table class="data-table">
        <thead>
          <tr><th>ID</th><th>Boss</th><th>Name</th><th>Type</th><th>Active</th></tr>
        </thead>
        <tbody>
          {#each data.mechanics as m (m.id)}
            <tr>
              <td class="mono">{m.id}</td>
              <td>{m.boss}</td>
              <td>{m.name}</td>
              <td>{m.mechanic_type}</td>
              <td>{m.active ? "✓" : "—"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  h1 {
    font-size: 1.75rem;
    color: #f0c040;
  }
  h2 {
    font-size: 1.1rem;
    color: #e8e6e1;
  }
  .sub {
    color: #888;
    font-size: 0.875rem;
  }
  .tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid #2a2a35;
  }
  .tabs button {
    padding: 0.5rem 1.25rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #888;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .tabs button.active {
    border-bottom-color: #f0c040;
    color: #f0c040;
  }
  .tab-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .player-form {
    background: #111114;
    border: 1px solid #2a2a35;
    padding: 1.25rem;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: #888;
  }
  input,
  select {
    background: #0d0d0f;
    border: 1px solid #2a2a35;
    color: #e8e6e1;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  .form-actions {
    display: flex;
    gap: 0.75rem;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .data-table th {
    text-align: left;
    padding: 0.6rem 0.75rem;
    border-bottom: 2px solid #2a2a35;
    color: #666;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
  .data-table td {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid #1a1a25;
  }
  .inactive td {
    opacity: 0.45;
  }
  .mono {
    font-family: monospace;
    font-size: 0.8rem;
  }
  .btn-primary {
    background: #f0c040;
    color: #0d0d0f;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-weight: bold;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
  }
  .btn-sm {
    background: transparent;
    border: 1px solid #3a3a4a;
    color: #a0a0b0;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  .btn-advance {
    border-color: #7b3fe4;
    color: #c080ff;
  }
  .role-badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .role--tank {
    background: #1a3a6b22;
    border: 1px solid #1a3a6b;
    color: #80aaff;
  }
  .role--healer {
    background: #1a6b3c22;
    border: 1px solid #1a6b3c;
    color: #80ffaa;
  }
  .role--dps {
    background: #6b1a1a22;
    border: 1px solid #6b1a1a;
    color: #ffaaaa;
  }
  .status-badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }
  .status--upcoming {
    background: #3a3a4a;
    color: #888;
  }
  .status--open {
    background: #1a6b3c22;
    color: #80ffaa;
  }
  .status--locked {
    background: #6b4a1a22;
    color: #ffcc80;
  }
  .status--scoring {
    background: #1a3a6b22;
    color: #80aaff;
  }
  .status--complete {
    background: #2a2a35;
    color: #555;
  }
</style>
