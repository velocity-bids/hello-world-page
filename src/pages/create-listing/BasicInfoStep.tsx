import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import type { ListingForm } from "./schema";

export default function BasicInfoStep() {
  const { t } = useTranslation();
  const form = useFormContext<ListingForm>();

  return (
    <div className="animate-in space-y-8 fade-in-50 duration-500">
      <div className="space-y-6 rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t("translation:createListing.basicInformation")}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:vehicle.make")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("translation:createListing.makePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:vehicle.model")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("translation:createListing.modelPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("translation:vehicle.year")}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
