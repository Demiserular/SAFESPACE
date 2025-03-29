import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { MobileNavBar } from "@/components/MobileNavBar"
import { NavBar } from "@/components/NavBar"
import { ThemeProvider } from "@/components/theme-provider"
import LoadingProvider from "@/components/loading-provider"

export const metadata: Metadata = {
  title: "Safe Space",
  description: "An anonymous community for support and connection",
  generator: "v0.dev",
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
          <LoadingProvider>
            <NavBar />
            <main className="pb-16 md:pb-0">
              {children}
            </main>
            <MobileNavBar />
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}