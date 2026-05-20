import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { TMAProvider } from '@/lib/telegram/sdk-provider'

export const metadata: Metadata = {
  title: 'Паспорт Щёлочь',
  description: 'Цифровой паспорт участника комьюнити Щёлочь',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <TMAProvider>{children}</TMAProvider>
      </body>
    </html>
  )
}
