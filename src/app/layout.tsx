import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader"; // Ensure this is the correct package
import { cn } from "@noteX/lib/utils";
import { ThemeProvider } from "@noteX/components/theme-provider";

export const metadata: Metadata = {
  title: "noteX",
  description:
    "noteX is a modern document signer and annotation tool that allows users to upload, highlight, underline, comment, and sign PDF documents seamlessly. With an intuitive UI and smooth functionality, noteX makes document collaboration and signing effortless.",
  icons: {
    icon: "A",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={cn("antialiased bg-background text-foreground")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange
        >
          {children}
          <NextTopLoader color="" />
          <Toaster richColors position="bottom-right" duration={1000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
