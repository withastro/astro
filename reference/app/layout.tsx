import './globals.css';
import { Inter } from 'next/font/google';
import { Navigation } from '@/app/components/Navigation';
import { Footer } from '@/app/components/Footer';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
