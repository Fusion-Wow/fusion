import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ locals }) => {
  if (locals.accessLevel !== "admin") error(403, "Forbidden");
  return json({ message: "Score computation scaffold ready" });
};
