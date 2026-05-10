import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: {
    default: "FahadCloud - AI-Powered Domain & Hosting Platform",
    template: "%s | FahadCloud",
  },
  description: "Register domains, deploy websites, manage hosting - all powered by your personal AI Cloud Engineer. Free domains, one-click deployment, real-time monitoring.",
  keywords: ["cloud hosting", "domain registration", "AI agent", "website deployment", "DNS management", "SSL certificates", "FahadCloud", "hosting Bangladesh"],
  authors: [{ name: "FahadCloud", url: "https://52.201.210.162" }],
  creator: "FahadCloud",
  publisher: "FahadCloud",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://52.201.210.162",
    siteName: "FahadCloud",
    title: "FahadCloud - AI-Powered Domain & Hosting Platform",
    description: "Register domains, deploy websites, manage hosting - all powered by your personal AI Cloud Engineer.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FahadCloud - AI-Powered Domain & Hosting Platform",
    description: "Register domains, deploy websites, manage hosting - all powered by your personal AI Cloud Engineer.",
  },
  icons: { icon: "/favicon.ico" },
  metadataBase: new URL("https://52.201.210.162"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
          Skip to main content
        </a>
        <main id="main-content" role="main">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

