import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VehicleGalleryProps {
  images: string[];
  vehicleName: string;
}

export function VehicleGallery({ images, vehicleName }: VehicleGalleryProps) {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const hasMultipleImages = images.length > 1;
  const maxThumbnails = 5;
  const remainingImages = images.length - maxThumbnails;
  const displayThumbnails = images.slice(0, maxThumbnails);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="space-y-4">
        <div className="group relative cursor-pointer overflow-hidden rounded-lg bg-muted" onClick={() => setIsLightboxOpen(true)}>
          <div className="relative aspect-[4/3]">
            <img src={`${images[selectedIndex]}/-/resize/911x/`} alt={`${vehicleName} - ${t("translation:createListing.photo", { count: selectedIndex + 1 })}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />

            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              aria-label={t("translation:vehicle.fullSize")}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>

            {hasMultipleImages && (
              <>
                <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handlePrevious(); }} aria-label={t("translation:common.previous")}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleNext(); }} aria-label={t("translation:common.next")}>
                  <ChevronRight className="h-6 w-6" />
                </Button>

                <div className="absolute bottom-4 right-4 rounded-lg bg-background/90 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                  {selectedIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>

        {hasMultipleImages && (
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-6">
            {displayThumbnails.map((image, index) => (
              <button key={index} onClick={() => setSelectedIndex(index)} className={`group relative aspect-[4/3] overflow-hidden rounded-md transition-all ${index === selectedIndex ? "ring-2 ring-primary ring-offset-2" : "opacity-60 hover:opacity-100"}`} aria-label={t("translation:vehicle.thumbnail", { count: index + 1 })}>
                <img src={image} alt={`${vehicleName} ${t("translation:vehicle.thumbnail", { count: index + 1 })}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
              </button>
            ))}

            {remainingImages > 0 && (
              <button onClick={() => setIsLightboxOpen(true)} className="group relative aspect-[4/3] overflow-hidden rounded-md transition-all" aria-label={t("translation:vehicle.moreImages", { count: remainingImages })}>
                <img src={images[maxThumbnails]} alt={`${vehicleName} - ${t("translation:vehicle.moreImages", { count: remainingImages })}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover blur-sm brightness-75" />
                <div className="relative flex h-full w-full items-center justify-center bg-background/30">
                  <span className="text-2xl font-bold text-white drop-shadow-lg">+{remainingImages}</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="w-auto max-w-[95vw] gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
          <div className="relative">
            <img src={images[selectedIndex]} alt={`${vehicleName} - ${t("translation:createListing.photo", { count: selectedIndex + 1 })}`} className="block max-h-[90vh] max-w-[95vw] transition-opacity duration-300" />

            <Button variant="ghost" size="icon" className="absolute right-4 top-4 h-10 w-10 rounded-full border border-border/50 bg-background/80 shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-background/90" onClick={() => setIsLightboxOpen(false)} aria-label={t("translation:common.cancel")}>
              <X className="h-5 w-5" />
            </Button>

            {hasMultipleImages && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-border/50 bg-background/80 shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-background/90" onClick={handlePrevious} aria-label={t("translation:common.previous")}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-border/50 bg-background/80 shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-background/90" onClick={handleNext} aria-label={t("translation:common.next")}>
                  <ChevronRight className="h-6 w-6" />
                </Button>

                <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-border/50 bg-background/80 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-md">
                  {selectedIndex + 1} / {images.length}
                </div>

                <div className="absolute bottom-6 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4">
                  <div className="scrollbar-hide flex justify-center gap-3 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <button key={index} onClick={() => setSelectedIndex(index)} className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${index === selectedIndex ? "scale-110 border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg" : "border-transparent opacity-60 hover:scale-105 hover:opacity-100"}`} aria-label={t("translation:vehicle.thumbnail", { count: index + 1 })}>
                        <img src={image} alt={t("translation:vehicle.thumbnail", { count: index + 1 })} className="h-20 w-24 object-cover" />
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
