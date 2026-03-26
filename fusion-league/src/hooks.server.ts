import type { Handle } from "@sveltejs/kit";
import { createServerClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";
import { resolveUserAccess } from "$lib/server/discord";

export const handle: Handle = async ({ event, resolve }) => {
  const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll(): { name: string; value: string }[] {
        return event.cookies.getAll();
      },
      setAll(cookies: { name: string; value: string; options: Record<string, unknown> }[]) {
        cookies.forEach(({ name, value, options }) =>
          event.cookies.set(name, value, { ...options, path: "/" } as Parameters<typeof event.cookies.set>[2]),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = user ? (await supabase.auth.getSession()).data.session : null;
  //test

  event.locals.session = session ?? null;
  event.locals.user = session?.user ?? null;
  event.locals.accessLevel = "blocked";
  event.locals.discordRoles = [];

  if (session?.provider_token) {
    try {
      const { accessLevel, roles } = await resolveUserAccess(session.provider_token);
      event.locals.accessLevel = accessLevel;
      event.locals.discordRoles = roles;
    } catch (err) {
      console.error("Failed to resolve Discord roles:", err);
      event.locals.accessLevel = "blocked";
    }
  }

  return resolve(event);
};
