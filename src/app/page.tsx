"use client";
import PDFUploader from "@noteX/components/document/PDFUploader";
import { ThemeToggle } from "@noteX/components/theme-toggle";
import { ScrollArea } from "@noteX/components/ui/scroll-area";

export default function Home() {
  return (
    <div className="h-screen w-full text-primary">
      <header className="h-[10%] flex items-center justify-between px-6 py-4 bg-[#2563eb] shadow-md">
        <h1 className="text-3xl font-sans font-extrabold text-white">noteX</h1>
        <ThemeToggle />
      </header>
      <div className="h-[90vh]">
        <ScrollArea className="h-full w-full">
          <div className="h-full flex items-center justify-center">
            <PDFUploader />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
