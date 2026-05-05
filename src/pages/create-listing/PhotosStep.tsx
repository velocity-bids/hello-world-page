import { Star, GripVertical, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ImageUploader } from "@/components/ImageUploader";
import { cn } from "@/lib/utils";
import { useListingPhotos } from "@/contexts/ListingPhotosContext";

interface SortablePhotoProps {
  id: string;
  preview: string;
  index: number;
  onRemove: (id: string) => void;
}

function SortablePhoto({ id, preview, index, onRemove }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border overflow-hidden bg-background select-none",
        isDragging && "opacity-50 shadow-2xl ring-2 ring-primary z-50"
      )}
    >
      <div className="relative">
        <img src={preview} alt={`Vehicle ${index + 1}`} className="w-full h-48 object-cover" />
        {index === 0 && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-current" />
            Cover
          </span>
        )}
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
          aria-label="Remove photo"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-3 py-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>Photo {index + 1}</span>
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function PhotosStep() {
  const { files, setFiles, previews } = useListingPhotos();

  // Each file is identified by its index as a string key
  const ids = files.map((_, i) => String(i));

  const handleFilesSelected = (incoming: File[]) => {
    setFiles([...files, ...incoming]);
  };

  const handleRemove = (id: string) => {
    const idx = parseInt(id);
    const nextFiles = files.filter((_, i) => i !== idx);
    setFiles(nextFiles);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    setFiles(arrayMove(files, oldIndex, newIndex));
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="bg-card rounded-lg p-6 border space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Vehicle Images *</h2>
          <p className="text-sm text-muted-foreground">
            Upload at least 5 images. The first image will be used as the cover photo.
          </p>
        </div>
        <ImageUploader onFilesSelected={handleFilesSelected} />
        {files.length > 0 && (
          <p className={cn("text-sm", files.length >= 5 ? "text-green-600" : "text-amber-600")}>
            {files.length >= 5 ? "✓" : "⚠"} {files.length} of 5 minimum images selected
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className="bg-card rounded-lg p-6 border space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Preview & Order</h2>
            <p className="text-sm text-muted-foreground">
              Drag to reorder. Click <X className="inline h-3 w-3" /> to remove a photo.
            </p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((_, index) => (
                  <SortablePhoto
                    key={index}
                    id={String(index)}
                    preview={previews[index]}
                    index={index}
                    onRemove={handleRemove}
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
