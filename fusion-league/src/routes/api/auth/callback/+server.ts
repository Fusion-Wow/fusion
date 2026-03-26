import type { RequestHandler } from "./$types";
import { redirect } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const { error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
    if (!error) redirect(303, next);
  }

  redirect(303, "/blocked");
};
