import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anton RAG | Conversational Data Analysis",
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
          colorPrimary: "#000000",
          colorBackground: "#ffffff",
          borderRadius: "0px",
        },
        elements: {
          card: "border border-black shadow-none",
          formButtonPrimary: "bg-black text-white hover:bg-black font-bold text-xs py-2.5 px-4",
          footerActionLink: "text-retro-link underline",
        }
      }}
    >
      <html lang="en" className="h-full">
        <body className="h-full antialiased">
          <div className="page-frame">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
