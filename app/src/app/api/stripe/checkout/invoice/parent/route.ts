import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, parentContacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentParentEmail } from "@/lib/parent-auth";
import { sendInvoiceCheckout } from "@/lib/invoice-checkout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: Request) {
  const email = await getCurrentParentEmail();
  if (!email) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");
  if (!invoiceId) return new NextResponse("Missing invoiceId", { status: 400 });

  // Verify the invoice belongs to a parent_contact with this email
  const [row] = await db
    .select({ invoiceId: invoices.id })
    .from(invoices)
    .innerJoin(parentContacts, eq(parentContacts.id, invoices.parentId))
    .where(and(eq(invoices.id, invoiceId), eq(parentContacts.email, email.toLowerCase())))
    .limit(1);

  if (!row) return new NextResponse("Not found", { status: 404 });

  try {
    await sendInvoiceCheckout(invoiceId);
  } catch (err) {
    console.error("Parent invoice checkout failed", err);
    return new NextResponse("Failed to create checkout", { status: 500 });
  }

  return NextResponse.redirect(`${APP_URL}/portal/invoices?sent=${invoiceId}`);
}
