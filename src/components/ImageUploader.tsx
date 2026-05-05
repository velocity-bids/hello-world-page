import { useRef, useCallback } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export const ImageUploader = ({ onFilesSelected, className }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming || incoming.length === 0) return;
      const imageFiles = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length) onFilesSelected(imageFiles);
    },
    [onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border",
        "bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors p-10 text-center",
        className
      )}
    >
      <ImagePlus className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="font-medium">Click to select or drag &amp; drop images</p>
        <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WEBP — multiple files allowed</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};
