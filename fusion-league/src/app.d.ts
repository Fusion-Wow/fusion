import type { Session, User } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import type { AccessLevel } from "$lib/types";

declare global {
  namespace App {
    interface Locals {
      session: Session | null;
      user: import("@supabase/supabase-js").User | null;
      accessLevel: AccessLevel;
      discordRoles: import("$lib/types").DiscordRole[];
    }
    interface PageData {
      session: Session | null;
      accessLevel: AccessLevel;
      [key: string]: unknown;
    }
  }
}

export {};
