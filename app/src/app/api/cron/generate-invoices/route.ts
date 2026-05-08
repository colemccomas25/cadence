import { NextResponse } from "next/server";
import { runInvoiceGeneration } from "@/lib/cron-invoice-generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const result = await runInvoiceGeneration();
  return NextResponse.json(result);
}
