import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Powerhouse | Energy Intelligence",
  description: "AI-powered electricity bill analysis and insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="site-root min-h-screen flex flex-col">
          <header className="site-header w-full py-4">
            <div className="container flex items-center justify-between">
              <div className="logo text-2xl font-bold flex items-center gap-3">
                <span className="w-8 h-8 rounded-md bg-accent-primary/20 flex items-center justify-center text-accent-primary">PH</span>
                <div>
                  <div className="leading-tight">Power<span className="accent-gradient-text">house</span></div>
                  <div className="text-xs text-text-secondary">Energy Intelligence</div>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-4">
                <a className="text-sm text-text-secondary hover:text-white">Demo</a>
                <a className="text-sm text-text-secondary hover:text-white">Docs</a>
                <button className="button-primary text-sm">Get Started</button>
              </nav>
            </div>
          </header>

          <main className="main-content flex-1 py-12">{children}</main>

          <footer className="w-full py-6">
            <div className="container text-center text-text-secondary text-sm">Built with ♥ — Frontend preview only</div>
          </footer>
        </div>
      </body>
    </html>
  );
}
