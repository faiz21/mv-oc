import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MV-Companion OS',
  description: 'Machine Vision Global — Operations Hub',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
