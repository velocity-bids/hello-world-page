import { format } from "date-fns";
import { useFormContext, useWatch } from "react-hook-form";

import { formatCurrency } from "@/lib/utils";

import type { ListingForm } from "./schema";

export default function ReviewStep() {
  const { control } = useFormContext<ListingForm>();
  const values = useWatch({ control });
  const photos = values.photos ?? [];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="bg-card rounded-lg p-6 border space-y-8">
        <h2 className="text-2xl font-semibold mb-4">Review Your Listing</h2>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-primary">Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((url, index) => (
              <img
                key={url}
                src={url}
                alt={`Vehicle ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-primary">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Make:</span>
              <p className="font-medium">{values.make}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Model:</span>
              <p className="font-medium">{values.model}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Year:</span>
              <p className="font-medium">{values.year}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mileage:</span>
              <p className="font-medium">{values.mileage?.toLocaleString()} km</p>
            </div>
            {values.vin && (
              <div className="col-span-2">
                <span className="text-muted-foreground">VIN:</span>
                <p className="font-medium">{values.vin}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-primary">Specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Exterior Color:</span>
              <p className="font-medium">{values.exteriorColor}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Interior Color:</span>
              <p className="font-medium">{values.interiorColor}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fuel Type:</span>
              <p className="font-medium">{values.fuelType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Transmission:</span>
              <p className="font-medium">{values.transmission}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Doors:</span>
              <p className="font-medium">{values.doors}</p>
            </div>
            {values.horsepower ? (
              <div>
                <span className="text-muted-foreground">Horsepower:</span>
                <p className="font-medium">{values.horsepower} HP</p>
              </div>
            ) : null}
            {values.engineDisplacement ? (
              <div>
                <span className="text-muted-foreground">Engine:</span>
                <p className="font-medium">{values.engineDisplacement} cm³</p>
              </div>
            ) : null}
            {values.engineType ? (
              <div>
                <span className="text-muted-foreground">Engine Type:</span>
                <p className="font-medium">{values.engineType}</p>
              </div>
            ) : null}
          </div>
          {values.description && (
            <div className="mt-4">
              <span className="text-muted-foreground">Description:</span>
              <p className="font-medium mt-1 whitespace-pre-wrap">{values.description}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-primary">History & Condition</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Imported:</span>
              <p className="font-medium">{values.imported ? "Yes" : "No"}</p>
            </div>
            {values.imported && values.importCountry ? (
              <div>
                <span className="text-muted-foreground">Import Country:</span>
                <p className="font-medium">{values.importCountry}</p>
              </div>
            ) : null}
            <div>
              <span className="text-muted-foreground">Maintenance Book:</span>
              <p className="font-medium">{values.maintenanceBook ? "Yes" : "No"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Smoker:</span>
              <p className="font-medium">{values.smoker ? "Yes" : "No"}</p>
            </div>
            {values.numberOfOwners ? (
              <div>
                <span className="text-muted-foreground">Number of Owners:</span>
                <p className="font-medium">{values.numberOfOwners}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-primary">Auction Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Reserve Price:</span>
              <p className="font-medium">{formatCurrency(values.reservePrice ?? 0)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Auction Ends:</span>
              <p className="font-medium">
                {values.auctionEndDate ? format(values.auctionEndDate, "PPP") : ""} at {values.auctionEndTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
