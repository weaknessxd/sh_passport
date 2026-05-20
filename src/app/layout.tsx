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
    <html lang="ru">
      <body>
        <TMAProvider>{children}</TMAProvider>
      </body>
    </html>
  )
}
