import type { RequestHandler } from "./$types";
import { redirect } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const POST: RequestHandler = async () => {
  await supabaseAdmin.auth.signOut();
  redirect(303, "/login");
};
