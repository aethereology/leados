import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadOS",
  description:
    "White-label CRM and agency software for local-business lead capture and follow-up.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
