import { useCallback } from "react";
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.name + index,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
    >
      <div className="aspect-video relative">
        <img
          src={URL.createObjectURL(file)}
          alt={`Upload ${index + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-2 bg-background rounded-lg hover:bg-accent cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onRemove}
            className="rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {index === 0 && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
            Primary
          </div>
        )}
      </div>
    </div>
  );
}

export function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        const isValid = file.type.startsWith("image/");
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

        if (!isValid) {
          toast.error(`${file.name} is not a valid image file`);
          return false;
        }
        if (!isValidSize) {
          toast.error(`${file.name} is too large. Max size is 10MB`);
          return false;
        }
        return true;
      });

      if (images.length + validFiles.length > 20) {
        toast.error("You can upload a maximum of 20 images");
        return;
      }

      onImagesChange([...images, ...validFiles]);
    },
    [images, onImagesChange]
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
      const oldIndex = images.findIndex((_, i) => (images[i].name + i) === active.id);
      const newIndex = images.findIndex((_, i) => (images[i].name + i) === over.id);
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
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop the images here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drag & drop images here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Upload up to 20 images (max 10MB each). The first image will be the primary image.
            </p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {images.length} image{images.length !== 1 ? "s" : ""} uploaded. Drag to reorder.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((file, i) => file.name + i)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((file, index) => (
                  <SortableImage
                    key={file.name + index}
                    file={file}
                    index={index}
                    onRemove={() => removeImage(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
