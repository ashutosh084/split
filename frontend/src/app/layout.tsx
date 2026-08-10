import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Split — Expense Manager",
  description: "Split expenses with friends, effortlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
