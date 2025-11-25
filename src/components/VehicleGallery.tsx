import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VehicleGalleryProps {
  images: string[];
  vehicleName: string;
}

export function VehicleGallery({
  images,
  vehicleName,
}: VehicleGalleryProps) {
  console.log("🚀 ~ VehicleGallery ~ images:", images)
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const hasMultipleImages = images.length > 1;
  const MAX_THUMBNAILS = 5;
  const remainingImages = images.length - MAX_THUMBNAILS;
  const displayThumbnails = images.slice(0, MAX_THUMBNAILS);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleMainImageClick = () => {
    setIsLightboxOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div
          className="group relative cursor-pointer overflow-hidden rounded-lg bg-muted"
          onClick={handleMainImageClick}
        >
          <div className="relative aspect-[4/3]">
            <img
              src={`${images[selectedIndex]}/-/resize/911x/`}
              alt={`${vehicleName} - Image ${selectedIndex + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 rounded-lg bg-background/90 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                  {selectedIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {hasMultipleImages && (
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-6">
            {displayThumbnails.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`group relative aspect-[4/3] overflow-hidden rounded-md transition-all ${
                  index === selectedIndex
                    ? "ring-2 ring-primary ring-offset-2"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={image}
                  alt={`${vehicleName} thumbnail ${index + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              </button>
            ))}

            {/* Show +X more button if there are more images */}
            {remainingImages > 0 && (
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="group relative aspect-[4/3] overflow-hidden rounded-md transition-all"
              >
                <img
                  src={images[MAX_THUMBNAILS]}
                  alt={`${vehicleName} - more images`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover blur-sm brightness-75"
                />
                <div className="relative flex h-full w-full items-center justify-center bg-background/30">
                  <span className="text-2xl font-bold text-white drop-shadow-lg">
                    +{remainingImages}
                  </span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-7xl p-0 bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
          <div className="relative bg-black/5 dark:bg-white/5">
            <img
              src={images[selectedIndex]}
              alt={`${vehicleName} - Full size`}
              className="h-[90vh] w-full object-contain transition-opacity duration-300"
            />

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-md hover:bg-background/90 hover:scale-110 transition-all shadow-lg border border-border/50"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation in Lightbox */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-md hover:bg-background/90 hover:scale-110 transition-all shadow-lg border border-border/50"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-md hover:bg-background/90 hover:scale-110 transition-all shadow-lg border border-border/50"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Image Counter in Lightbox */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 backdrop-blur-md px-4 py-2 text-sm font-medium shadow-lg border border-border/50">
                  {selectedIndex + 1} / {images.length}
                </div>

                {/* Thumbnail Strip in Lightbox */}
                <div className="absolute bottom-6 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4">
                  <div className="flex justify-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => handleThumbnailClick(index)}
                        className={`flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200 border-2 ${
                          index === selectedIndex
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 border-primary shadow-lg"
                            : "opacity-60 hover:opacity-100 hover:scale-105 border-transparent"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-20 w-24 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
