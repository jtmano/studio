import type { Metadata } from 'next';
import { Geist_Sans } from 'geist/font/sans'; // Corrected import path
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const geistSans = Geist_Sans({ 
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Geist Mono can be kept if needed for specific mono sections, but Geist Sans for body.
// const geistMono = Geist_Mono({ 
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'Fitness Focus',
  description: 'Log your workouts, track progress, and get AI-powered exercise suggestions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`}> {/* Use font-sans utility for Geist */}
        {children}
        <Toaster /> {/* Add Toaster here for global notifications */}
      </body>
    </html>
  );
}
