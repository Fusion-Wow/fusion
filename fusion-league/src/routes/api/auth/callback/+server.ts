import type { RequestHandler } from "./$types";
import { redirect } from "@sveltejs/kit";
import { createServerClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, { ...options, path: "/" } as Parameters<typeof cookies.set>[2]),
          );
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(303, next);
  }

  redirect(303, "/blocked");
};
