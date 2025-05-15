import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

// The GeistSans object from 'geist/font/sans' directly provides .variable
// which sets up the CSS variable (e.g., --font-geist-sans) and a class.
// No need to call it as a function.

// Geist Mono can be imported and used similarly if needed.
// import { GeistMono } from 'geist/font/mono';
// const geistMonoVariable = GeistMono.variable;

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
      {/*
        Applying GeistSans.variable to the body (or html) tag makes the CSS variable
        --font-geist-sans available. The globals.css file already sets the font-family
        on the body using this variable.
      */}
      <body className={`${GeistSans.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
