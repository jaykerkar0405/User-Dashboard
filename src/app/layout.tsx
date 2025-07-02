/**
 * Root Layout Component
 * Provides the base structure and providers for the entire application
 */
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

// Configure Inter font with Latin subset
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Metadata configuration for the application
export const metadata: Metadata = {
  title: "EBT Dashboard",
};

/**
 * RootLayout Component
 * Wraps the application with necessary providers and layout components
 */
const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased ${inter.variable}`}>
        <ThemeProvider
          enableSystem
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
        >
          <AuthProvider>
            <Header />
            {children}
            <Toaster />
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
