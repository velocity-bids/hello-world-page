import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { CalendarIcon } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { ListingForm } from "./schema";

function BooleanRadioField({
  name,
  label,
  falseLabel,
  trueLabel,
  falseId,
  trueId,
}: {
  name: "imported" | "maintenanceBook" | "smoker";
  label: string;
  falseLabel: string;
  trueLabel: string;
  falseId: string;
  trueId: string;
}) {
  const form = useFormContext<ListingForm>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup onValueChange={(value) => field.onChange(value === "true")} value={field.value ? "true" : "false"} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={falseId} />
                <Label htmlFor={falseId}>{falseLabel}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={trueId} />
                <Label htmlFor={trueId}>{trueLabel}</Label>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default function DetailsStep() {
  const { t } = useTranslation();
  const form = useFormContext<ListingForm>();
  const imported = useWatch({ control: form.control, name: "imported" });

  return (
    <div className="animate-in space-y-8 fade-in-50 duration-500">
      <div className="space-y-6 rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t("translation:createListing.vehicleDetails")}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:vehicle.mileage")}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder={t("translation:createListing.mileagePlaceholder")} {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:createListing.vinOptional")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("translation:createListing.vinPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exteriorColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:vehicle.exteriorColor")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("translation:createListing.exteriorColorPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="interiorColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:vehicle.interiorColor")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("translation:createListing.interiorColorPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="horsepower"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:createListing.horsepowerOptional")}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder={t("translation:createListing.horsepowerPlaceholder")} {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="engineDisplacement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:createListing.engineDisplacementOptional")}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder={t("translation:createListing.engineDisplacementPlaceholder")} {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="engineType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:createListing.engineTypeOptional")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("translation:createListing.engineTypePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:vehicle.fuelType")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("translation:createListing.fuelTypePlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(["gasoline", "diesel", "hybrid", "electric", "other"] as const).map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`translation:vehicle.fuelTypes.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:vehicle.transmission")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("translation:createListing.transmissionPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(["manual", "automatic", "semiAutomatic"] as const).map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`translation:vehicle.transmissions.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="doors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:createListing.doorsLabel")}</FormLabel>
                <FormControl>
                  <Input type="number" min="2" max="6" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("translation:vehicle.description")}</FormLabel>
              <FormControl>
                <Textarea placeholder={t("translation:createListing.descriptionPlaceholder")} className="min-h-[150px]" {...field} />
              </FormControl>
              <FormDescription>{t("translation:createListing.descriptionHelp")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-6 rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t("translation:createListing.historyCondition")}</h2>

        <BooleanRadioField name="imported" label={t("translation:createListing.importedQuestion")} falseLabel={t("translation:common.no")} trueLabel={t("translation:common.yes")} falseId="not-imported" trueId="imported" />

        {imported && (
          <FormField
            control={form.control}
            name="importCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:createListing.importCountry")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("translation:createListing.importCountryPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <BooleanRadioField name="maintenanceBook" label={t("translation:createListing.maintenanceBookQuestion")} falseLabel={t("translation:common.no")} trueLabel={t("translation:common.yes")} falseId="no-book" trueId="has-book" />

        <BooleanRadioField name="smoker" label={t("translation:createListing.smokerQuestion")} falseLabel={t("translation:common.no")} trueLabel={t("translation:common.yes")} falseId="non-smoker" trueId="smoker" />

        <FormField
          control={form.control}
          name="numberOfOwners"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("translation:createListing.numberOfOwnersOptional")}</FormLabel>
              <FormControl>
                <Input type="number" min="1" placeholder={t("translation:createListing.numberOfOwnersPlaceholder")} {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-6 rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t("translation:createListing.auctionDetails")}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="reservePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:myListings.reservePrice")}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder={t("translation:createListing.reservePricePlaceholder")} {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormDescription>{t("translation:createListing.reservePriceHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startingBid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:createListing.startingBidOptional")}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder={t("translation:createListing.startingBidPlaceholder")} {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                </FormControl>
                <FormDescription>{t("translation:createListing.startingBidHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="auctionEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("translation:createListing.auctionEndDate")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>{t("translation:createListing.pickDate")}</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus className={cn("pointer-events-auto p-3")} />
                  </PopoverContent>
                </Popover>
                <FormDescription>{t("translation:createListing.auctionEndDateHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="auctionEndTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("translation:createListing.auctionEndTime")}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormDescription>{t("translation:createListing.auctionEndTimeHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
