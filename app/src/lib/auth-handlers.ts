// Re-export the GET/POST handlers from auth.ts for the App Router catch-all route.
// Kept as a separate file so /api/auth/[...nextauth]/route.ts only re-exports.
import { handlers } from "./auth";

export const { GET, POST } = handlers;
