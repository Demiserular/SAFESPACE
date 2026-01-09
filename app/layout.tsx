import React, { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { MobileNavBar } from "@/components/MobileNavBar"
import { NavBar } from "@/components/NavBar"
import { ThemeProvider } from "@/components/theme-provider"
import LoadingProvider from "@/components/loading-provider"
import { OfflineIndicator } from "@/components/OfflineIndicator"
import { Toaster } from "@/components/ui/toaster"
import { PageTransition } from "@/components/PageTransition"
import { DataProvider } from "@/lib/data-provider"

export const metadata: Metadata = {
  title: "Safe Space",
  description: "An anonymous community for support and connection",
  generator: "v0.dev",
  manifest: "/manifest.json",
  icons: {
    icon: "/safe-space.png",
    shortcut: "/safe-space.",
    apple: "/safe-space.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Safe Space",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Safe Space",
    title: "Safe Space - Mental Health Support",
    description: "A secure platform for mental health support and community connection",
  },
  twitter: {
    card: "summary",
    title: "Safe Space - Mental Health Support",
    description: "A secure platform for mental health support and community connection",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DataProvider>
            <Suspense fallback={null}>
              <LoadingProvider>
                <OfflineIndicator />
                <NavBar />
                <main className="pb-20 md:pb-0 min-h-screen flex flex-col">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
                <MobileNavBar />
              </LoadingProvider>
            </Suspense>
          </DataProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}