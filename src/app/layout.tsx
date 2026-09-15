import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planify — Your Personal Productivity Companion",
  description:
    "A modern personal productivity app to manage daily tasks, notes, and documents. Stay organized, build habits, and achieve your goals every day.",
  keywords: ["productivity", "tasks", "notes", "planning", "daily checklist"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('planify-theme') || 'system';
                  var resolved = theme;
                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(resolved);
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              duration: 3000,
              className: "!rounded-xl !border-border",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
