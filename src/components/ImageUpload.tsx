import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDropzone } from "react-dropzone";
import { X, Upload, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
}

function SortableImage({ file, index, onRemove }: { file: File; index: number; onRemove: () => void }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.name + index,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative overflow-hidden rounded-lg border-2 border-border bg-muted transition-colors hover:border-primary">
      <div className="relative aspect-video">
        <img src={URL.createObjectURL(file)} alt={t("translation:createListing.photo", { count: index + 1 })} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" {...attributes} {...listeners} className="cursor-grab rounded-lg bg-background p-2 hover:bg-accent active:cursor-grabbing" aria-label={t("translation:common.sort")}>
            <GripVertical className="h-5 w-5" />
          </button>
          <Button type="button" variant="destructive" size="icon" onClick={onRemove} className="rounded-lg" aria-label={t("translation:common.removePhoto")}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        {index === 0 && (
          <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
            {t("translation:common.primary")}
          </div>
        )}
      </div>
    </div>
  );
}

export function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        const isValid = file.type.startsWith("image/");
        const isValidSize = file.size <= 10 * 1024 * 1024;

        if (!isValid) {
          toast.error(t("translation:errors.invalidImageFile", { name: file.name }));
          return false;
        }
        if (!isValidSize) {
          toast.error(t("translation:errors.imageTooLarge", { name: file.name }));
          return false;
        }
        return true;
      });

      if (images.length + validFiles.length > 20) {
        toast.error(t("translation:errors.maxImages", { count: 20 }));
        return;
      }

      onImagesChange([...images, ...validFiles]);
    },
    [images, onImagesChange, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: true,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((_, i) => images[i].name + i === active.id);
      const newIndex = images.findIndex((_, i) => images[i].name + i === over.id);
      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">{t("translation:createListing.imageUploadPrompt")}</p>
        ) : (
          <div>
            <p className="mb-2 text-lg font-medium">{t("translation:createListing.imageUploadPrompt")}</p>
            <p className="text-sm text-muted-foreground">{t("translation:createListing.imageFormats")}</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {t("translation:createListing.imageCount", { count: images.length })}. {t("translation:createListing.dragToReorder")}
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map((file, i) => file.name + i)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {images.map((file, index) => (
                  <SortableImage key={file.name + index} file={file} index={index} onRemove={() => removeImage(index)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
