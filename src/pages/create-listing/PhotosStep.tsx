import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { FileUploader } from "@/components/UploadCareWidget";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ListingForm } from "./schema";

export default function PhotosStep() {
  const form = useFormContext<ListingForm>();
  const photos = useWatch({ control: form.control, name: "photos" }) ?? [];

  const updatePhotos = (nextPhotos: string[]) => {
    form.setValue("photos", nextPhotos, { shouldDirty: true, shouldTouch: true });
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= photos.length) {
      return;
    }

    const nextPhotos = [...photos];
    [nextPhotos[index], nextPhotos[nextIndex]] = [nextPhotos[nextIndex], nextPhotos[index]];
    updatePhotos(nextPhotos);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">Vehicle Images *</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload at least 5 images of your vehicle. The first image will be used as the cover photo.
        </p>
        <FileUploader onUploadComplete={updatePhotos} />
        {photos.length > 0 && (
          <p className={cn("text-sm mt-2", photos.length >= 5 ? "text-green-600" : "text-amber-600")}>
            {photos.length >= 5 ? "✓" : "⚠"} {photos.length} of 5 minimum images uploaded
          </p>
        )}
      </div>

      {photos.length > 0 && (
        <div className="bg-card rounded-lg p-6 border space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Preview & Order</h2>
            <p className="text-sm text-muted-foreground">
              Reorder your images to choose which photo appears first in the listing.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((url, index) => (
              <div key={url} className="rounded-lg border overflow-hidden bg-background">
                <img
                  src={url}
                  alt={`Vehicle ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">Photo {index + 1}</span>
                    {index === 0 && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Star className="h-4 w-4 fill-current" />
                        Cover
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => movePhoto(index, -1)}
                      disabled={index === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Earlier
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => movePhoto(index, 1)}
                      disabled={index === photos.length - 1}
                    >
                      Later
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
