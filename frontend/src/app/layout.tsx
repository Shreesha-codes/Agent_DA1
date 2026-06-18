import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Agent_DA | Conversational Data Analysis",
  description: "Ask your database or spreadsheets anything in plain English and get interactive charts and narratives.",
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
          colorPrimary: "#cc785c",
          colorBackground: "#faf9f5",
          borderRadius: "8px",
        },
        elements: {
          card: "border border-[#e6dfd8] shadow-none bg-[#ffffff]",
          formButtonPrimary: "bg-[#cc785c] text-white font-body text-xs py-2.5 px-4 rounded-md",
          formFieldInput: "border border-[#e6dfd8] rounded-md font-body text-sm",
          footerActionLink: "text-[#cc785c] hover:text-[#a9583e]",
        }
      }}
    >
      <html lang="en" className="h-full">
        <body className={`${inter.variable} h-full antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
