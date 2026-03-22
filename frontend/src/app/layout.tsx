import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Voiceless — Every story matters. No name needed.",
  description:
    "An anonymous storytelling platform where human stories are produced as intimate audio experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* ElevenLabs Conversational AI Widget */}
        <Script
          src="https://unpkg.com/@elevenlabs/convai-widget-embed"
          strategy="lazyOnload"
        />
      </head>
      <body
        className={`${geistSans.variable} antialiased bg-black text-zinc-100 min-h-screen`}
      >
        {/* Header */}
        <header className="border-b border-zinc-900">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-light tracking-wide text-zinc-100">
              voiceless
            </Link>
            <nav className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/" className="hover:text-zinc-200 transition">
                Stories
              </Link>
              <Link href="/moments" className="hover:text-zinc-200 transition">
                Moments
              </Link>
              <Link href="/submit" className="hover:text-zinc-200 transition">
                Share
              </Link>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-zinc-900 mt-16">
          <div className="max-w-3xl mx-auto px-4 py-6 text-center text-xs text-zinc-600">
            Every story matters. No name needed.
            <br />
            Powered by Firecrawl + ElevenLabs
          </div>
        </footer>
      </body>
    </html>
  );
}
