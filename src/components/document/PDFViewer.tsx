/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Save,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Highlighter,
  Pencil,
  Type,
  Square,
  Eraser,
  Download,
} from "lucide-react";
import { cn } from "@noteX/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

// Define custom types
type Position = {
  x: number;
  y: number;
};

type EditTool = "highlight" | "pencil" | "text" | "rectangle" | "eraser" | null;

type AnnotationBase = {
  tool: string;
  page: number;
  color: string;
};

type PencilAnnotation = AnnotationBase & {
  tool: "pencil";
  points: Position[];
  lineWidth: number;
};

type TextAnnotation = AnnotationBase & {
  tool: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
};

type RectangleAnnotation = AnnotationBase & {
  tool: "highlight" | "rectangle" | "eraser";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  lineWidth: number;
};

type Annotation = PencilAnnotation | TextAnnotation | RectangleAnnotation;

interface PDFViewerProps {
  pdfFile: File;
  onClose: () => void;
}

interface DocumentLoadSuccess {
  numPages: number;
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export default function PDFViewer({ pdfFile, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [activeEditTool, setActiveEditTool] = useState<EditTool>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPosition, setStartPosition] = useState<Position>({ x: 0, y: 0 });
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const editTools = [
    {
      id: "highlight" as const,
      icon: <Highlighter size={20} />,
      name: "Highlight",
    },
    { id: "pencil" as const, icon: <Pencil size={20} />, name: "Draw" },
    { id: "text" as const, icon: <Type size={20} />, name: "Add Text" },
    { id: "rectangle" as const, icon: <Square size={20} />, name: "Add Shape" },
    { id: "eraser" as const, icon: <Eraser size={20} />, name: "Eraser" },
  ];

  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile);
      setPreviewURL(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [pdfFile]);

  useEffect(() => {
    const setupCanvas = () => {
      if (!pdfContainerRef.current) return;

      setTimeout(() => {
        if (!pdfContainerRef.current) return;
        const pdfElement =
          pdfContainerRef.current.querySelector(".react-pdf__Page");
        if (!pdfElement || !canvasRef.current) return;

        const { width, height } = pdfElement.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        drawAnnotations();
      }, 300);
    };

    setupCanvas();
  });

  function onDocumentLoadSuccess({ numPages }: DocumentLoadSuccess) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(numPages || 1, newPageNumber));
    });
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3.0));
  }

  function zoomOut() {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  }

  function rotateClockwise() {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  }

  function selectEditTool(toolId: EditTool) {
    setActiveEditTool((prevTool) => (prevTool === toolId ? null : toolId));

    if (toolId !== "text" && textInputRef.current) {
      document.body.removeChild(textInputRef.current);
      textInputRef.current = null;
    }

    if (toolId) {
      toast.info(
        `${toolId.charAt(0).toUpperCase() + toolId.slice(1)} tool selected`
      );
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeEditTool || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setIsDrawing(true);
    setStartPosition({ x, y });

    if (activeEditTool === "pencil") {
      setCurrentAnnotation({
        tool: "pencil",
        page: pageNumber,
        points: [{ x, y }],
        color: "#ff0000",
        lineWidth: 2,
      });
    } else if (activeEditTool === "text") {
      const input = document.createElement("input");
      input.type = "text";
      input.style.position = "absolute";
      input.style.left = `${e.clientX}px`;
      input.style.top = `${e.clientY}px`;
      input.style.zIndex = "1000";
      input.style.minWidth = "100px";
      input.style.border = "1px dashed #3b82f6";
      input.style.padding = "4px";
      input.style.fontSize = "16px";

      input.addEventListener("blur", () => {
        if (input.value.trim()) {
          const newAnnotation: TextAnnotation = {
            tool: "text",
            page: pageNumber,
            x,
            y,
            text: input.value,
            color: "#000000",
            fontSize: 16 * (1 / scale),
          };

          setAnnotations((prev) => [...prev, newAnnotation]);
          setHasUnsavedChanges(true);
          drawAnnotations();
        }
        document.body.removeChild(input);
        textInputRef.current = null;
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          input.blur();
        }
      });

      document.body.appendChild(input);
      input.focus();
      textInputRef.current = input;
    } else {
      setCurrentAnnotation({
        tool: activeEditTool,
        page: pageNumber,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        color:
          activeEditTool === "highlight" ? "rgba(255, 255, 0, 0.4)" : "#3b82f6",
        lineWidth: activeEditTool === "highlight" ? 20 : 2,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !canvasRef.current || !currentAnnotation) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (currentAnnotation.tool === "pencil") {
      setCurrentAnnotation((prev) => {
        if (!prev || prev.tool !== "pencil") return prev;
        return {
          ...prev,
          points: [...prev.points, { x, y }],
        };
      });
    } else if (
      currentAnnotation.tool === "highlight" ||
      currentAnnotation.tool === "rectangle" ||
      currentAnnotation.tool === "eraser"
    ) {
      setCurrentAnnotation((prev) => {
        if (
          !prev ||
          (prev.tool !== "highlight" &&
            prev.tool !== "rectangle" &&
            prev.tool !== "eraser")
        )
          return prev;
        return {
          ...prev,
          endX: x,
          endY: y,
        };
      });
    }

    drawAnnotations();
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;
    setIsDrawing(false);

    if (activeEditTool === "eraser" && currentAnnotation.tool === "eraser") {
      const { startX, startY, endX, endY } = currentAnnotation;
      const eraserMinX = Math.min(startX, endX);
      const eraserMaxX = Math.max(startX, endX);
      const eraserMinY = Math.min(startY, endY);
      const eraserMaxY = Math.max(startY, endY);

      setAnnotations((prev) =>
        prev.filter((ann) => {
          if (ann.page !== pageNumber) return true;

          if (ann.tool === "text") {
            return !(
              ann.x >= eraserMinX &&
              ann.x <= eraserMaxX &&
              ann.y >= eraserMinY &&
              ann.y <= eraserMaxY
            );
          } else if (ann.tool === "pencil") {
            return !ann.points.some(
              (pt) =>
                pt.x >= eraserMinX &&
                pt.x <= eraserMaxX &&
                pt.y >= eraserMinY &&
                pt.y <= eraserMaxY
            );
          } else if (ann.tool === "highlight" || ann.tool === "rectangle") {
            const annMinX = Math.min(ann.startX, ann.endX);
            const annMaxX = Math.max(ann.startX, ann.endX);
            const annMinY = Math.min(ann.startY, ann.endY);
            const annMaxY = Math.max(ann.startY, ann.endY);

            return !(
              annMaxX >= eraserMinX &&
              annMinX <= eraserMaxX &&
              annMaxY >= eraserMinY &&
              annMinY <= eraserMaxY
            );
          }
          return true;
        })
      );

      setHasUnsavedChanges(true);
    } else if (activeEditTool !== "text") {
      setAnnotations((prev) => [...prev, currentAnnotation]);
      setHasUnsavedChanges(true);
    }

    setCurrentAnnotation(null);

    drawAnnotations();
  };

  const drawAnnotations = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scale, scale);

    annotations
      .filter((ann) => ann.page === pageNumber)
      .forEach((ann) => {
        ctx.beginPath();

        if (ann.tool === "pencil") {
          if (ann.points.length < 2) return;

          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.lineWidth;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";

          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.stroke();
        } else if (ann.tool === "highlight" || ann.tool === "rectangle") {
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.lineWidth;

          if (ann.tool === "highlight") {
            ctx.fillStyle = ann.color;
            ctx.fillRect(
              ann.startX,
              ann.startY,
              ann.endX - ann.startX,
              ann.endY - ann.startY
            );
          } else {
            ctx.strokeRect(
              ann.startX,
              ann.startY,
              ann.endX - ann.startX,
              ann.endY - ann.startY
            );
          }
        } else if (ann.tool === "text") {
          ctx.font = `${ann.fontSize}px Arial`;
          ctx.fillStyle = ann.color;
          ctx.fillText(ann.text, ann.x, ann.y);
        }
      });

    if (isDrawing && currentAnnotation) {
      ctx.beginPath();

      if (currentAnnotation.tool === "pencil") {
        ctx.strokeStyle = currentAnnotation.color;
        ctx.lineWidth = currentAnnotation.lineWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        if (currentAnnotation.points.length > 1) {
          ctx.moveTo(
            currentAnnotation.points[0].x,
            currentAnnotation.points[0].y
          );
          for (let i = 1; i < currentAnnotation.points.length; i++) {
            ctx.lineTo(
              currentAnnotation.points[i].x,
              currentAnnotation.points[i].y
            );
          }
          ctx.stroke();
        }
      } else if (
        currentAnnotation.tool === "highlight" ||
        currentAnnotation.tool === "rectangle" ||
        currentAnnotation.tool === "eraser"
      ) {
        if (currentAnnotation.tool === "eraser") {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = "#ff0000";
        } else {
          ctx.strokeStyle = currentAnnotation.color;
        }

        ctx.lineWidth = currentAnnotation.lineWidth;

        if (currentAnnotation.tool === "highlight") {
          ctx.fillStyle = currentAnnotation.color;
          ctx.fillRect(
            currentAnnotation.startX,
            currentAnnotation.startY,
            currentAnnotation.endX - currentAnnotation.startX,
            currentAnnotation.endY - currentAnnotation.startY
          );
        } else {
          ctx.strokeRect(
            currentAnnotation.startX,
            currentAnnotation.startY,
            currentAnnotation.endX - currentAnnotation.startX,
            currentAnnotation.endY - currentAnnotation.startY
          );
        }

        if (currentAnnotation.tool === "eraser") {
          ctx.setLineDash([]);
        }
      }
    }

    ctx.restore();
  };

  function saveAnnotations() {
    setHasUnsavedChanges(false);

    const savedData = {
      pdfName: pdfFile?.name,
      annotations,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("pdfAnnotations", JSON.stringify(savedData));
    toast.success("PDF annotations saved!");
  }

  function hexToRgb(hex: string | undefined): RGBColor {
    if (!hex || typeof hex !== "string") {
      return { r: 0, g: 0, b: 0 };
    }

    if (hex.startsWith("rgba")) {
      const parts = hex.slice(5, -1).split(",");
      return {
        r: parseInt(parts[0].trim()),
        g: parseInt(parts[1].trim()),
        b: parseInt(parts[2].trim()),
      };
    }

    hex = hex.replace("#", "");

    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }

  async function downloadPDFWithAnnotations() {
    if (!previewURL) {
      toast.error("No PDF loaded");
      return;
    }

    try {
      setIsProcessing(true);
      toast.info("Preparing annotated PDF...");

      // Fetch the PDF file
      const existingPdfBytes = await fetch(previewURL).then((res) =>
        res.arrayBuffer()
      );

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      for (const annotation of annotations) {
        const pageIndex = annotation.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { width, height } = page.getSize();

        if (annotation.tool === "highlight") {
          page.drawRectangle({
            x: annotation.startX,
            y:
              height -
              annotation.startY -
              (annotation.endY - annotation.startY),
            width: annotation.endX - annotation.startX,
            height: annotation.endY - annotation.startY,
            color: rgb(1, 1, 0.4),
            opacity: 0.4,
          });
        } else if (annotation.tool === "rectangle") {
          const color = hexToRgb(annotation.color);
          page.drawRectangle({
            x: annotation.startX,
            y:
              height -
              annotation.startY -
              (annotation.endY - annotation.startY),
            width: annotation.endX - annotation.startX,
            height: annotation.endY - annotation.startY,
            borderColor: rgb(color.r / 255, color.g / 255, color.b / 255),
            borderWidth: annotation.lineWidth,
            opacity: 1,
          });
        } else if (annotation.tool === "text") {
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const color = hexToRgb(annotation.color);

          page.drawText(annotation.text, {
            x: annotation.x,
            y: height - annotation.y,
            size: annotation.fontSize,
            font: font,
            color: rgb(color.r / 255, color.g / 255, color.b / 255),
          });
        } else if (
          annotation.tool === "pencil" &&
          annotation.points.length > 1
        ) {
          const color = hexToRgb(annotation.color);

          const convertedPoints = annotation.points.map((point) => ({
            x: point.x,
            y: height - point.y,
          }));

          for (let i = 0; i < convertedPoints.length - 1; i++) {
            page.drawLine({
              start: { x: convertedPoints[i].x, y: convertedPoints[i].y },
              end: { x: convertedPoints[i + 1].x, y: convertedPoints[i + 1].y },
              thickness: annotation.lineWidth,
              color: rgb(color.r / 255, color.g / 255, color.b / 255),
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = pdfFile.name.replace(".pdf", "_annotated.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);
      toast.success("Annotated PDF downloaded successfully!");
    } catch (error) {
      console.error("Error creating annotated PDF:", error);
      toast.error("Failed to create annotated PDF");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="w-full h-full rounded-lg bg-muted shadow-lg flex flex-col text-primary">
      <div className="bg- p-2 flex items-center justify-between border-b bg-primary-foreground">
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#e5e7eb] rounded-full"
            title="Back to upload"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium ml-2">{pdfFile?.name}</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-primary text-secondary rounded-md shadow px-3 py-1">
            <span>
              Page {pageNumber} of {numPages || "--"}
            </span>
          </div>
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className={cn(
              "p-1.5 rounded-full",
              pageNumber <= 1
                ? "text-[#9ca3af]"
                : "hover:bg-[#e5e7eb] hover:text-black"
            )}
            title="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 0)}
            className={cn(
              "p-1.5 rounded-full",
              pageNumber >= (numPages || 0)
                ? "text-[#9ca3af]"
                : "hover:bg-[#e5e7eb] hover:text-black"
            )}
            title="Next page"
          >
            <ChevronRight size={20} />
          </button>

          <div className="h-6 border-l border-[#d1d5db] mx-2"></div>

          <button
            onClick={zoomOut}
            className="p-1.5 hover:bg-[#e5e7eb] rounded-full hover:text-black"
            title="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            className="p-1.5 hover:bg-[#e5e7eb] rounded-full hover:text-black"
            title="Zoom in"
          >
            <ZoomIn size={20} />
          </button>

          <button
            onClick={rotateClockwise}
            className="p-1.5 hover:bg-[#e5e7eb] rounded-full hover:text-black"
            title="Rotate clockwise"
          >
            <RotateCw size={20} />
          </button>

          <div className="h-6 border-l border-[#d1d5db] mx-2"></div>

          <button
            onClick={saveAnnotations}
            className={cn(
              "px-3 py-1 text-white rounded flex items-center",
              hasUnsavedChanges
                ? "bg-[#3b82f6] hover:bg-[#2563eb]"
                : "bg-[#3b82f6] hover:bg-[#2563eb]"
            )}
            title="Save changes"
          >
            <Save size={16} className="mr-1" />
            Save
          </button>

          <button
            onClick={downloadPDFWithAnnotations}
            className="p-1.5 hover:bg-[#e5e7eb] hover:text-black rounded-full"
            title="Download PDF"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-14 bg-primary-foreground border-r flex flex-col items-center py-4 space-y-4">
          {editTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => selectEditTool(tool.id)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                activeEditTool === tool.id
                  ? "bg-[#3b82f6] text-white"
                  : "hover:bg-[#e5e7eb] text-[#6b7280]"
              )}
              title={tool.name}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="flex-1 relative" ref={pdfContainerRef}>
          <ScrollArea className="h-[83vh] w-full">
            <div className="flex justify-center p-4">
              {previewURL ? (
                <div
                  className="relative"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <Document
                    file={previewURL}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="shadow-lg"
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      rotate={rotation}
                      renderTextLayer={false}
                      renderAnnotationLayer={true}
                    />
                  </Document>
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{
                      pointerEvents: activeEditTool ? "auto" : "none",
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 w-full">
                  <p>Loading PDF...</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="absolute bottom-0 left-0 right-0 bg-primary-foreground p-2 text-sm border-t">
            <div className="flex justify-between">
              <span>
                {activeEditTool
                  ? `Tool: ${
                      activeEditTool.charAt(0).toUpperCase() +
                      activeEditTool.slice(1)
                    }${hasUnsavedChanges ? " (Unsaved changes)" : ""}`
                  : `${
                      hasUnsavedChanges ? "Unsaved changes" : "No tool selected"
                    }`}
              </span>
              <span>
                {pdfFile?.name} • {Math.round(pdfFile?.size / 1024)} KB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
