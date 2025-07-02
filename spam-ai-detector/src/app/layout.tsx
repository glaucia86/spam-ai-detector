import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Spam AI Detector - Advanced Email Security',
  description: 'AI-powered spam detection for email security. Analyze emails instantly with high accuracy.',
  keywords: ['spam-detection', 'email-security', 'AI', 'machine-learning', 'spam-filter'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}