import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Spam Detector with AI - Advanced Email Security',
  description: 'AI-powered spam detector for email security. Analyze emails instantly with high accuracy using machine learning algorithms.',
  keywords: ['spam-detection', 'email-security', 'AI', 'machine-learning', 'spam-filter', 'text-analysis'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}