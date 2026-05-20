import type { Metadata } from 'next'
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
    <html lang="ru" className="h-full dark">
      <body className="min-h-full bg-black text-white">
        <TMAProvider>{children}</TMAProvider>
      </body>
    </html>
  )
}
