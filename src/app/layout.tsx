
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistrar } from '@/components/layout/ServiceWorkerRegistrar'; // Import the registrar

export const metadata: Metadata = {
  title: 'Fitness Focus',
  description: 'Log your workouts, track progress, and get AI-powered exercise suggestions.',
  // manifest: '/manifest.json', // Handled by direct link tag
  // themeColor: '#000000', // Handled by direct meta tag
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

        {/* iOS specific PWA tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Fitness Focus" />
        
        {/* Placeholder Apple Touch Icon. Replace with your actual icon. */}
        <link rel="apple-touch-icon" href="https://placehold.co/180x180.png" sizes="180x180" data-ai-hint="app logo" />
        
        {/* You can add more icon sizes for apple-touch-icon if needed */}
        {/* e.g., <link rel="apple-touch-icon" href="https://placehold.co/152x152.png" sizes="152x152" data-ai-hint="app logo" /> */}

        {/* Existing favicon link - ensure it's compatible or replace if necessary */}
        {/* The original template had: <link rel="icon" href="/favicon.ico?favicon.56766c03.ico" sizes="48x48" type="image/x-icon"/> */}
        {/* For PWA, you might prefer PNG icons referenced in the manifest, but an .ico can coexist. */}
        {/* If you create PNG favicons, link them here too, e.g.: */}
        {/* <link rel="icon" type="image/png" sizes="32x32" href="https://placehold.co/32x32.png" data-ai-hint="favicon small" /> */}
        {/* <link rel="icon" type="image/png" sizes="16x16" href="https://placehold.co/16x16.png" data-ai-hint="favicon tiny" /> */}

      </head>
      <body className={`${GeistSans.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <ServiceWorkerRegistrar /> {/* Add Service Worker Registrar */}
      </body>
    </html>
  );
}
