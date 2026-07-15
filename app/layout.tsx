import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Muslim Biopharma Collaborative",
    template: "%s — Muslim Biopharma Collaborative",
  },
  description:
    "Member directory for the Muslim Biopharma Collaborative.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1a1a1a",
          borderRadius: "0.5rem",
          fontFamily: "Inter, sans-serif",
        },
      }}
    >
      <html lang="en" className={`${inter.variable} h-full`}>
        <body className="flex min-h-full flex-col">
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
