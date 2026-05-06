import { Star, GripVertical, X } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "select-none overflow-hidden rounded-lg border bg-background",
        isDragging && "z-50 opacity-50 shadow-2xl ring-2 ring-primary"
      )}
    >
      <div className="relative">
        <img src={preview} alt={t("translation:createListing.photo", { count: index + 1 })} className="h-48 w-full object-cover" />
        {index === 0 && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            <Star className="h-3 w-3 fill-current" />
            {t("translation:createListing.cover")}
          </span>
        )}
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
          aria-label={t("translation:common.removePhoto")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground">
        <span>{t("translation:createListing.photo", { count: index + 1 })}</span>
        <button type="button" className="touch-none rounded p-1 hover:bg-muted cursor-grab active:cursor-grabbing" {...attributes} {...listeners} aria-label={t("translation:common.sort")}>
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function PhotosStep() {
  const { t } = useTranslation();
  const { files, setFiles, previews } = useListingPhotos();

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
    <div className="animate-in space-y-8 fade-in-50 duration-500">
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">{t("translation:createListing.vehicleImages")}</h2>
          <p className="text-sm text-muted-foreground">{t("translation:createListing.uploadImagesMin")}</p>
        </div>
        <ImageUploader onFilesSelected={handleFilesSelected} />
        {files.length > 0 && (
          <p className={cn("text-sm", files.length >= 5 ? "text-green-600" : "text-amber-600")}>
            {files.length >= 5 ? "✓" : "⚠"} {t("translation:createListing.minimumImagesSelected", { count: files.length })}
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div>
            <h2 className="mb-1 text-xl font-semibold">{t("translation:createListing.previewOrder")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("translation:createListing.dragToReorder")} <X className="inline h-3 w-3" />
            </p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {files.map((_, index) => (
                  <SortablePhoto key={index} id={String(index)} preview={previews[index]} index={index} onRemove={handleRemove} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
