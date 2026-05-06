import { useRef, useCallback } from "react";
import { ImagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export const ImageUploader = ({ onFilesSelected, className }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

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
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-colors hover:bg-muted/50",
        className
      )}
    >
      <ImagePlus className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="font-medium">{t("translation:createListing.imageUploadPrompt", { defaultValue: "Click to select or drag & drop images" })}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("translation:createListing.imageFormats", { defaultValue: "JPG, PNG, WEBP — multiple files allowed" })}</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
};
