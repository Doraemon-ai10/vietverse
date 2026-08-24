import './globals.css'
import type { Metadata } from 'next'
import AIAssistant from './ai-assistant'

export const metadata: Metadata = {
  title: 'VietVerse 🇻🇳',
  description: 'Thế giới game online Việt Nam',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}<AIAssistant /></body></html>
}
