import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { publicConfig } from "@/env";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicConfig.siteUrl),
  title: {
    default: `Wochenplan · ${publicConfig.clubName}`,
    template: `%s · ${publicConfig.clubName}`,
  },
  description:
    "Der wöchentliche Turnier- und Veranstaltungsplan des Golfclubs Hude – übersichtlich und als PDF.",
  applicationName: "Golf in Hude Wochenplan",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: `Wochenplan · ${publicConfig.clubName}`,
    description: "Der wöchentliche Turnier- und Veranstaltungsplan des Golfclubs Hude.",
    siteName: publicConfig.clubName,
    locale: "de_DE",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#094d3b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
