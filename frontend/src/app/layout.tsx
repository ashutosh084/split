import type { Metadata } from "next";
import "./globals.css";

const SITE_NAME = "Split";
const SITE_TITLE = "Split — Expense Manager";
const SITE_DESCRIPTION =
  "Split expenses with friends, effortlessly. Track who owes what, settle up, and stay on top of shared costs.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/favicon.ico",
        width: 256,
        height: 256,
        alt: "Split logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/favicon.ico"],
  },
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
