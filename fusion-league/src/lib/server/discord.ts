import { DISCORD_SERVER_ID } from "$env/static/private";
import { resolveAccessLevel } from "$lib/types";
import type { AccessLevel, DiscordRole } from "$lib/types";

const DISCORD_API = "https://discord.com/api/v10";

export async function resolveUserAccess(
  accessToken: string,
): Promise<{ accessLevel: AccessLevel; roles: DiscordRole[]; inGuild: boolean }> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds/${DISCORD_SERVER_ID}/member`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 404) return { accessLevel: "blocked", roles: [], inGuild: false };
  if (!res.ok) throw new Error(`Discord API error: ${res.status}`);

  const member = await res.json();

  const roleRes = await fetch(`${DISCORD_API}/guilds/${DISCORD_SERVER_ID}/roles`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!roleRes.ok) throw new Error(`Discord roles error: ${roleRes.status}`);
  const allRoles = await roleRes.json();

  const roleIdToName = new Map(allRoles.map((r: { id: string; name: string }) => [r.id, r.name]));
  const memberRoleNames = (member.roles as string[]).map((id) => roleIdToName.get(id)).filter(Boolean) as DiscordRole[];

  return {
    accessLevel: resolveAccessLevel(memberRoleNames),
    roles: memberRoleNames,
    inGuild: true,
  };
}
