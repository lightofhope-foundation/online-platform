import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { UI_SHELL_COOKIE, parseUiShellVersion } from "@/lib/uiShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Light of Hope — Online Platform",
  description: "Therapy platform MVP",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialUiShell = parseUiShellVersion(
    cookieStore.get(UI_SHELL_COOKIE)?.value
  );

  return (
    <html lang="de">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://assets.mediadelivery.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; media-src 'self' blob: data: https://vz-f7a686f2-d74.b-cdn.net https://*.b-cdn.net; frame-src 'self' https://iframe.mediadelivery.net;"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers initialUiShell={initialUiShell}>{children}</Providers>
      </body>
    </html>
  );
}
