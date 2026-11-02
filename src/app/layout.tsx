// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { RelayProvider } from '@/context/RelayContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RelayMap | Evidence-First Project Handover Platform',
  description: 'Keep the work. Transfer the knowledge. Built by Team White Noise.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <RelayProvider>{children}</RelayProvider>
      </body>
    </html>
  );
}