import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadence — studio software for music teachers",
  description:
    "Cadence handles your recurring weekly lessons, monthly invoices, and parent reminders — without the spreadsheet, the missing payments, or the seven tabs you have open right now.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
