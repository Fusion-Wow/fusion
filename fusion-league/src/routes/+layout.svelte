<script lang="ts">
  import type { LayoutData } from "./$types";
  const { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="app">
  <nav class="nav">
    <a href="/">⚡ Fusion League</a>
    <div class="nav-links">
      <a href="/">Leaderboard</a>
      {#if data.accessLevel === "picker" || data.accessLevel === "admin"}
        <a href="/picks">My Picks</a>
      {/if}
      {#if data.accessLevel === "admin"}
        <a href="/config">Config</a>
      {/if}
    </div>
    <div class="nav-user">
      {#if data.session}
        <span class="badge badge--{data.accessLevel}">{data.accessLevel}</span>
        <form method="POST" action="/api/auth/logout">
          <button type="submit">Log out</button>
        </form>
      {/if}
    </div>
  </nav>

  <main>
    {@render children()}
  </main>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :global(body) {
    background: #0d0d0f;
    color: #e8e6e1;
    font-family: "Georgia", serif;
  }
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .nav {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 1rem 2rem;
    background: #111114;
    border-bottom: 1px solid #2a2a35;
  }
  .nav a {
    color: #f0c040;
    text-decoration: none;
    font-size: 1.1rem;
    font-weight: bold;
  }
  .nav-links {
    display: flex;
    gap: 1.5rem;
    flex: 1;
  }
  .nav-links a {
    color: #a0a0b0;
    font-size: 0.9rem;
    font-weight: normal;
  }
  .nav-links a:hover {
    color: #f0c040;
  }
  .nav-user {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;
  }
  .badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .badge--admin {
    background: #7b3fe4;
    color: white;
  }
  .badge--picker {
    background: #1a6b3c;
    color: white;
  }
  .badge--viewer {
    background: #3a3a4a;
    color: #a0a0b0;
  }
  .badge--blocked {
    background: #6b1a1a;
    color: #ffaaaa;
  }
  main {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  button {
    background: transparent;
    border: 1px solid #3a3a4a;
    color: #a0a0b0;
    padding: 0.3rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  button:hover {
    border-color: #f0c040;
    color: #f0c040;
  }
</style>
