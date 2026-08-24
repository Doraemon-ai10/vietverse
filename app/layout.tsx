import './globals.css'
import type { Metadata } from 'next'
import AIAssistant from './ai-assistant'
import PwaRegister from './pwa-register'

export const metadata: Metadata = {
  title: 'VietVerse 🇻🇳',
  description: 'Thế giới game online Việt Nam',
  manifest: '/manifest.webmanifest',
  applicationName: 'VietVerse',
  themeColor: '#0b6cff',
  appleWebApp: { capable: true, title: 'VietVerse', statusBarStyle: 'black-translucent' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}<AIAssistant /><PwaRegister /></body></html>
}
