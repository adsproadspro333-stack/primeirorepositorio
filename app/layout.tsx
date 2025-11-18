import type React from "react"
import type { Metadata } from "next"
import { Public_Sans } from "next/font/google"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { theme } from "./theme"
import "./globals.css"
import HeaderBar from "./components/HeaderBar"
import { ToastProvider } from "./components/ui/Toast"

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "CHRYS Prêmios",
  description: "Sorteios e promoções",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${publicSans.className} with-sticky-header`}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastProvider>
              <HeaderBar />
              <main className="page-content" style={{ minHeight: "100dvh" }}>
                {children}
              </main>
            </ToastProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
