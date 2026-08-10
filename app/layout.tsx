import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '건물 관리 시스템',
  description: '건물 관리 및 유지보수 현황 관리 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">{children}</body>
    </html>
  )
}
