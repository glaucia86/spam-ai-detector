import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Detector de Spam com IA - Segurança Avançada de Email',
  description: 'Detector de spam alimentado por IA para segurança de email. Analise emails instantaneamente com alta precisão usando algoritmos de aprendizado de máquina.',
  keywords: ['detecção-spam', 'segurança-email', 'IA', 'aprendizado-máquina', 'filtro-spam', 'análise-texto'],
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