<script lang="ts">
  import { supabase } from "$lib/supabase";

  async function loginWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: "identify guilds.members.read",
      },
    });
  }
</script>

<svelte:head><title>Fusion League</title></svelte:head>

<div class="page">
  <div class="card">
    <div class="icon">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 6H38V28C38 35.7 32.7 42 26 42C19.3 42 14 35.7 14 28V6Z"
          fill="#f0c040"
          stroke="#c89a20"
          stroke-width="1.5"
        />
        <path d="M14 12H6C6 12 6 24 14 24" stroke="#c89a20" stroke-width="2" stroke-linecap="round" />
        <path d="M38 12H46C46 12 46 24 38 24" stroke="#c89a20" stroke-width="2" stroke-linecap="round" />
        <rect x="20" y="42" width="12" height="4" fill="#f0c040" />
        <rect x="16" y="46" width="20" height="3" rx="1.5" fill="#c89a20" />
      </svg>
    </div>
    <h1>Fusion League</h1>
    <p class="sub">TBC Classic Fantasy Draft</p>
    <div class="divider"></div>
    <button class="discord-btn" onclick={loginWithDiscord}>
      <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
        <path
          d="M60.1 4.9A58.5 58.5 0 0 0 45.6.9a.2.2 0 0 0-.2.1 40.8 40.8 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.4 37.4 0 0 0 25.6 1a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.9 4.9a.2.2 0 0 0-.1.1C1.6 18.1-.9 31 .3 43.7a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 8.9.2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.8a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.3 0a.2.2 0 0 1 .2 0l1.1.8a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47.1 47.1 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.7-8.9.2.2 0 0 0 .1-.2c1.5-15.3-2.5-28.6-10.5-40.4a.2.2 0 0 0-.1-.2ZM23.7 36c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1Z"
          fill="white"
        />
      </svg>
      Sign in with Discord
    </button>
    <p class="note">Access limited to Fusion guild members</p>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at top, #1a1a2e 0%, #0d0d0f 60%);
  }

  .card {
    background: #111114;
    border: 1px solid #2a2a35;
    border-radius: 16px;
    padding: 3rem 2.5rem;
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 0 60px rgba(240, 192, 64, 0.05);
  }

  .icon {
    margin-bottom: 0.5rem;
    filter: drop-shadow(0 0 12px rgba(240, 192, 64, 0.4));
  }

  h1 {
    font-size: 1.75rem;
    font-weight: bold;
    color: #f0c040;
    margin: 0;
    letter-spacing: 0.05em;
  }

  .sub {
    color: #666;
    font-size: 0.85rem;
    margin: 0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .divider {
    width: 100%;
    height: 1px;
    background: #2a2a35;
    margin: 0.5rem 0;
  }

  .discord-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    background: #5865f2;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.15s;
  }

  .discord-btn:hover {
    background: #4752c4;
  }

  .note {
    color: #444;
    font-size: 0.75rem;
    margin: 0;
  }
</style>
