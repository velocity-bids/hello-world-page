import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useFormContext, useWatch } from "react-hook-form";

import { formatCurrency } from "@/lib/utils";

import type { ListingForm } from "./schema";

export default function ReviewStep() {
  const { t } = useTranslation();
  const { control } = useFormContext<ListingForm>();
  const values = useWatch({ control });
  const photos = values.photos ?? [];

  return (
    <div className="animate-in space-y-8 fade-in-50 duration-500">
      <div className="space-y-8 rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-2xl font-semibold">{t("translation:createListing.reviewYourListing")}</h2>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-primary">{t("translation:vehicle.images")}</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {photos.map((url, index) => (
              <img key={url} src={url} alt={t("translation:createListing.photo", { count: index + 1 })} className="h-32 w-full rounded-lg border object-cover" />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-primary">{t("translation:createListing.basicInformation")}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.make")}:</span>
              <p className="font-medium">{values.make}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.model")}:</span>
              <p className="font-medium">{values.model}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.year")}:</span>
              <p className="font-medium">{values.year}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.mileage")}:</span>
              <p className="font-medium">{values.mileage?.toLocaleString()} km</p>
            </div>
            {values.vin && (
              <div className="col-span-2">
                <span className="text-muted-foreground">{t("translation:vehicle.vin")}:</span>
                <p className="font-medium">{values.vin}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-primary">{t("translation:createListing.specifications")}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.exteriorColor")}:</span>
              <p className="font-medium">{values.exteriorColor}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.interiorColor")}:</span>
              <p className="font-medium">{values.interiorColor}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.fuelType")}:</span>
              <p className="font-medium">{values.fuelType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.transmission")}:</span>
              <p className="font-medium">{values.transmission}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.doors")}:</span>
              <p className="font-medium">{values.doors}</p>
            </div>
            {values.horsepower ? (
              <div>
                <span className="text-muted-foreground">{t("translation:vehicle.horsepower")}:</span>
                <p className="font-medium">{values.horsepower} HP</p>
              </div>
            ) : null}
            {values.engineDisplacement ? (
              <div>
                <span className="text-muted-foreground">{t("translation:vehicle.engine")}:</span>
                <p className="font-medium">{values.engineDisplacement} cm³</p>
              </div>
            ) : null}
            {values.engineType ? (
              <div>
                <span className="text-muted-foreground">{t("translation:vehicle.engineType")}:</span>
                <p className="font-medium">{values.engineType}</p>
              </div>
            ) : null}
          </div>
          {values.description && (
            <div className="mt-4">
              <span className="text-muted-foreground">{t("translation:vehicle.description")}:</span>
              <p className="mt-1 whitespace-pre-wrap font-medium">{values.description}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-primary">{t("translation:createListing.historyCondition")}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">{t("translation:createListing.imported")}:</span>
              <p className="font-medium">{values.imported ? t("translation:common.yes") : t("translation:common.no")}</p>
            </div>
            {values.imported && values.importCountry ? (
              <div>
                <span className="text-muted-foreground">{t("translation:createListing.importCountry")}:</span>
                <p className="font-medium">{values.importCountry}</p>
              </div>
            ) : null}
            <div>
              <span className="text-muted-foreground">{t("translation:createListing.maintenanceBook")}:</span>
              <p className="font-medium">{values.maintenanceBook ? t("translation:common.yes") : t("translation:common.no")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("translation:createListing.smoker")}:</span>
              <p className="font-medium">{values.smoker ? t("translation:common.yes") : t("translation:common.no")}</p>
            </div>
            {values.numberOfOwners ? (
              <div>
                <span className="text-muted-foreground">{t("translation:createListing.numberOfOwners")}:</span>
                <p className="font-medium">{values.numberOfOwners}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-primary">{t("translation:createListing.auctionDetails")}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("translation:myListings.reservePrice")}:</span>
              <p className="font-medium">{formatCurrency(values.reservePrice ?? 0)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("translation:vehicle.auctionEnds")}:</span>
              <p className="font-medium">
                {values.auctionEndDate
                  ? t("translation:createListing.auctionEndsAt", {
                      date: format(values.auctionEndDate, "PPP"),
                      time: values.auctionEndTime,
                    })
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
