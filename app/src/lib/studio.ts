import { cache } from "react";
import { db } from "@/db";
import { studios, users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function _getOrCreateStudio(
  userId: string | undefined,
  email: string | undefined,
  userName: string | null | undefined,
) {
  let ownerId = userId;

  // Fallback for sessions created before userId was stored in the JWT
  if (!ownerId && email) {
    let [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!u) {
      [u] = await db
        .insert(users)
        .values({ email, name: userName ?? null })
        .returning();
    }
    ownerId = u.id;
  }

  if (!ownerId) throw new Error("Cannot determine user ID");

  const [existing] = await db
    .select()
    .from(studios)
    .where(eq(studios.ownerId, ownerId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(studios)
    .values({
      ownerId,
      name: userName ? `${userName}'s Studio` : "My Studio",
    })
    .returning();
  return created;
}

// Memoized per-request for server components (layout + page both call this cheaply)
export const getOrCreateStudio = cache(_getOrCreateStudio);

// Non-cached version for server actions (which run outside React's render tree)
export const getOrCreateStudioUncached = _getOrCreateStudio;
