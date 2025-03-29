import { cn } from "@noteX/lib/utils";
import { FileText, Upload, X } from "lucide-react";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "sonner";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { ScrollArea } from "../ui/scroll-area";
import PDFViewer from "./PDFViewer";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function PDFUploader() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [isEditing, setIsEditing] = useState(false);

  const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5];

  interface FileChangeEvent extends React.ChangeEvent<HTMLInputElement> {
    target: HTMLInputElement & { files: FileList | null };
  }

  const handleFileChange = (event: FileChangeEvent) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      uploadFile(file);
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

  interface DropEvent extends React.DragEvent<HTMLDivElement> {
    dataTransfer: DataTransfer & {
      files: FileList;
    };
  }

  const handleDrop = (event: DropEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      uploadFile(file);
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

  const handleRemove = () => {
    setPdfFile(null);
    setPreviewURL(null);
    setIsEditing(false);
  };

  interface UploadFileParams {
    file: File;
  }

  const uploadFile = (file: UploadFileParams["file"]): void => {
    setLoading(true);
    setTimeout(() => {
      setPdfFile(file);
      setPreviewURL(URL.createObjectURL(file));
      setLoading(false);
    }, 1500);
  };

  const fitToContainer = () => {
    setScale(0.9);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCloseEditor = () => {
    setIsEditing(false);
  };

  if (isEditing && pdfFile) {
    return <PDFViewer pdfFile={pdfFile} onClose={handleCloseEditor} />;
  }

  return (
    <div className="w-full max-w-4xl p-6 text-primary">
      <div
        className={cn(
          "border-2 border-dashed border-[#3B82F6] rounded-lg p-6 h-full min-h-[550px] md:min-h-[600px] flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="animate-spin rounded-full border-t-4 border-[#3B82F6] border-solid h-10 w-10" />
        ) : previewURL ? (
          <div className="flex flex-col items-center relative w-full h-full">
            <div className="flex items-center justify-between w-full mb-4">
              <p className="font-medium">{pdfFile?.name}</p>
              <div className="flex items-center space-x-2">
                <button
                  className="px-2 py-1 bg-[#3B82F6] text-white rounded text-sm cursor-pointer"
                  onClick={fitToContainer}
                >
                  Fit to width
                </button>
                <select
                  title="Select zoom level"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="px-2 py-1 bg-secondary border rounded text-sm focus:outline-none cursor-pointer"
                >
                  {zoomLevels.map((level) => (
                    <option key={level} value={level}>{`${
                      level * 100
                    }%`}</option>
                  ))}
                </select>
                <button
                  className="p-1.5 rounded-full bg-[#D1D5DB] text-[#EF4444] hover:bg-[#9CA3AF] focus:outline-none cursor-pointer"
                  onClick={handleRemove}
                  title="Remove PDF"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="w-full flex-grow overflow-hidden bg-[#F3F4F6] rounded relative">
              <Document file={previewURL} className="flex justify-center">
                <ScrollArea className="h-[500px] w-full">
                  <div className="flex justify-center p-4">
                    <Page
                      pageNumber={1}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                </ScrollArea>
              </Document>

              <button
                className="p-2 bg-[#3B82F6] text-white rounded text-sm absolute right-2 bottom-2 cursor-pointer"
                onClick={handleEditClick}
              >
                Edit PDF
              </button>
            </div>
          </div>
        ) : (
          <>
            <FileText className="w-16 h-16 text-[#3B82F6] mb-4" />
            <p className="text-center mb-4">Drag & drop a PDF file here, or</p>
            <button
              type="button"
              className="px-4 py-2 bg-[#3B82F6] text-[#FFFFFF] focus:outline-none rounded-lg flex items-center hover:bg-[#2563EB] transition-colors"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <Upload className="mr-2" size={20} />
              Select PDF
            </button>

            <input
              id="fileInput"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
              title="Upload PDF"
            />
          </>
        )}
      </div>
    </div>
  );
}
