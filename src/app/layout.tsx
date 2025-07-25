
'use client';

import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';

const inter = Inter({ 
  subsets: ['latin'], 
  display: 'swap',
  variable: '--font-sans' 
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-headline',
});

// Even with 'use client', we can define metadata.
// Next.js will handle this correctly.
const metadata: Metadata = {
  title: 'SplitSync',
  description: 'Effortless expense splitting for groups and events.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <title>{String(metadata.title)}</title>
        <meta name="description" content={String(metadata.description)} />
      </head>
      <body className={`font-sans antialiased ${inter.variable} ${poppins.variable}`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
