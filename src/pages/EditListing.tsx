import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { getVehicleById } from "@/db/queries";
import { updateVehicle } from "@/db/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { CalendarIcon, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { FileUploader } from "@/components/UploadCareWidget";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Vehicle } from "@/types";

interface VehicleWithExtras extends Vehicle {
  starting_bid?: number;
}

type ListingForm = {
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin?: string;
  description: string;
  reservePrice: number;
  startingBid?: number;
  auctionEndDate: Date;
  auctionEndTime: string;
  horsepower?: number;
  engineType?: string;
  exteriorColor: string;
  interiorColor: string;
  engineDisplacement?: number;
  fuelType: string;
  transmission: string;
  doors: number;
  imported: boolean;
  importCountry?: string;
  maintenanceBook: boolean;
  smoker: boolean;
  numberOfOwners?: number;
};

export default function EditListing() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [vehicle, setVehicle] = useState<VehicleWithExtras | null>(null);
  const [fileUrl, setFileUrl] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [editRestricted, setEditRestricted] = useState(false);

  const schema = useMemo(() => {
    const requiredField = (fieldKey: string) => t("translation:errors.fieldRequired", { field: t(fieldKey) });
    return z.object({
      make: z.string().min(1, requiredField("vehicle.make")).max(50, t("translation:errors.maxCharacters", { count: 50 })),
      model: z.string().min(1, requiredField("vehicle.model")).max(50, t("translation:errors.maxCharacters", { count: 50 })),
      year: z.number().min(1900).max(new Date().getFullYear() + 1),
      mileage: z.number().min(0),
      vin: z.string().optional(),
      description: z.string().min(10, t("translation:errors.minCharacters", { count: 10 })).max(2000, t("translation:errors.maxCharacters", { count: 2000 })),
      reservePrice: z.number().min(0),
      startingBid: z.number().min(0).optional(),
      auctionEndDate: z.date({ required_error: t("translation:errors.auctionEndDateRequired") }),
      auctionEndTime: z.string().min(1, t("translation:errors.auctionEndTimeRequired")),
      horsepower: z.number().min(0).optional(),
      engineType: z.string().optional(),
      exteriorColor: z.string().min(1, requiredField("vehicle.exteriorColor")),
      interiorColor: z.string().min(1, requiredField("vehicle.interiorColor")),
      engineDisplacement: z.number().min(0).optional(),
      fuelType: z.string().min(1, requiredField("vehicle.fuelType")),
      transmission: z.string().min(1, requiredField("vehicle.transmission")),
      doors: z.number().min(2).max(6),
      imported: z.boolean(),
      importCountry: z.string().optional(),
      maintenanceBook: z.boolean(),
      smoker: z.boolean(),
      numberOfOwners: z.number().min(1).optional(),
    });
  }, [t]);

  const form = useForm<ListingForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      mileage: 0,
      vin: "",
      description: "",
      reservePrice: 0,
      startingBid: 0,
      auctionEndTime: "12:00",
      horsepower: 0,
      engineType: "",
      exteriorColor: "",
      interiorColor: "",
      engineDisplacement: 0,
      fuelType: "",
      transmission: "",
      doors: 4,
      imported: false,
      importCountry: "",
      maintenanceBook: false,
      smoker: false,
      numberOfOwners: 1,
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
    }
  }, [user, authLoading, openLoginModal]);

  useEffect(() => {
    if (id && user) {
      fetchVehicle();
    }
  }, [id, user]);

  const fetchVehicle = async () => {
    try {
      const { data, error } = await getVehicleById(id!);

      if (error || !data) {
        toast.error(t("translation:errors.vehicleNotFound"));
        navigate("/my-listings");
        return;
      }

      if (data.seller_id !== user?.id) {
        toast.error(t("translation:errors.ownListingOnly"));
        navigate("/my-listings");
        return;
      }

      const hasBids = (data.bid_count || 0) > 0;
      const isPending = data.approval_status === "pending";

      if (hasBids) {
        setEditRestricted(true);
        setCanEdit(true);
      } else if (isPending || data.status === "active") {
        setCanEdit(true);
      } else {
        toast.error(t("translation:errors.listingCannotEdit"));
        navigate("/my-listings");
        return;
      }

      setVehicle(data as VehicleWithExtras);
      setFileUrl(data.images || []);

      const endTime = new Date(data.auction_end_time);
      form.reset({
        make: data.make,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        vin: data.vin || "",
        description: data.description || "",
        reservePrice: data.reserve_price || 0,
        startingBid: (data as VehicleWithExtras).starting_bid || 0,
        auctionEndDate: endTime,
        auctionEndTime: `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`,
        horsepower: data.horsepower || 0,
        engineType: data.engine_type || "",
        exteriorColor: data.exterior_color || "",
        interiorColor: data.interior_color || "",
        engineDisplacement: data.engine_displacement || 0,
        fuelType: data.fuel_type || "",
        transmission: data.transmission || "",
        doors: data.doors || 4,
        imported: data.imported || false,
        importCountry: data.import_country || "",
        maintenanceBook: data.maintenance_book || false,
        smoker: data.smoker || false,
        numberOfOwners: data.number_of_owners || 1,
      });
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      toast.error(t("translation:errors.failedLoadVehicle"));
      navigate("/my-listings");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ListingForm) => {
    if (!user || !vehicle) return;

    if (fileUrl.length < 5) {
      toast.error(t("translation:errors.keepFiveImages"));
      return;
    }

    setIsSubmitting(true);

    try {
      let updateData: Record<string, any> = {
        description: data.description,
        images: fileUrl,
        image_url: fileUrl[0],
      };

      if (!editRestricted) {
        const [hours, minutes] = data.auctionEndTime.split("translation::");
        const auctionDateTime = new Date(data.auctionEndDate);
        auctionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        updateData = {
          ...updateData,
          make: data.make,
          model: data.model,
          year: data.year,
          mileage: data.mileage,
          vin: data.vin || null,
          reserve_price: data.reservePrice,
          starting_bid: data.startingBid || 0,
          auction_end_time: auctionDateTime.toISOString(),
          horsepower: data.horsepower || null,
          engine_type: data.engineType || null,
          exterior_color: data.exteriorColor,
          interior_color: data.interiorColor,
          engine_displacement: data.engineDisplacement || null,
          fuel_type: data.fuelType,
          transmission: data.transmission,
          doors: data.doors,
          imported: data.imported,
          import_country: data.imported ? data.importCountry : null,
          maintenance_book: data.maintenanceBook,
          smoker: data.smoker,
          number_of_owners: data.numberOfOwners || null,
        };
      }

      const { error } = await updateVehicle(vehicle.id, user.id, updateData);
      if (error) throw error;

      toast.success(t("translation:errors.listingUpdated"));
      navigate("/my-listings");
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error(t("translation:errors.listingUpdateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (!canEdit || !vehicle) {
    return null;
  }

  return (
    <main className="flex-1 bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/my-listings")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("translation:createListing.backToMyListings")}
        </Button>

        <h1 className="mb-4 text-4xl font-bold">{t("translation:createListing.editListing")}</h1>
        <p className="mb-8 text-muted-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</p>

        {editRestricted && (
          <Alert className="mb-8" variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("translation:createListing.limitedEditingTitle")}</AlertTitle>
            <AlertDescription>{t("translation:createListing.limitedEditingDescription")}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">{t("translation:createListing.vehicleImages")}</h2>
              <p className="mb-4 text-sm text-muted-foreground">{t("translation:createListing.vehicleImagesHelpEdit")}</p>
              <FileUploader onUploadComplete={setFileUrl} />
              {fileUrl.length > 0 && (
                <div className="mt-4">
                  <p className={cn("text-sm", fileUrl.length >= 5 ? "text-green-600" : "text-amber-600")}>
                    {fileUrl.length >= 5 ? "✓" : "⚠"} {t("translation:createListing.imageCount", { count: fileUrl.length })}
                  </p>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {fileUrl.map((url, index) => (
                      <img key={index} src={url} alt={t("translation:createListing.photo", { count: index + 1 })} className="h-20 w-full rounded object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">{t("translation:createListing.basicInformation")}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField control={form.control} name="make" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:vehicle.make")}</FormLabel>
                    <FormControl><Input {...field} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:vehicle.model")}</FormLabel>
                    <FormControl><Input {...field} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:vehicle.year")}</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mileage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:vehicle.mileage")}</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:createListing.vinOptional")}</FormLabel>
                    <FormControl><Input {...field} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">{t("translation:createListing.specifications")}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField control={form.control} name="exteriorColor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:vehicle.exteriorColor")}</FormLabel>
                    <FormControl><Input {...field} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="interiorColor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:vehicle.interiorColor")}</FormLabel>
                    <FormControl><Input {...field} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fuelType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:vehicle.fuelType")}</FormLabel>
                    <FormControl><Input {...field} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="transmission" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:vehicle.transmission")}</FormLabel>
                    <FormControl><Input {...field} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="doors" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:vehicle.doors")}</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="horsepower" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:createListing.horsepowerOptional")}</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="engineDisplacement" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("translation:createListing.engineDisplacementOptional")}</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} disabled={editRestricted} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">{t("translation:vehicle.description")}</h2>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder={t("translation:createListing.descriptionPlaceholder")} rows={6} {...field} />
                  </FormControl>
                  <FormDescription>{t("translation:createListing.descriptionHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </Card>

            {!editRestricted && (
              <Card className="p-6">
                <h2 className="mb-4 text-xl font-semibold">{t("translation:createListing.auctionDetails")}</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField control={form.control} name="reservePrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("translation:myListings.reservePrice")}</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} /></FormControl>
                      <FormDescription>{t("translation:createListing.reservePricePlaceholder")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="startingBid" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("translation:createListing.startingBidOptional")}</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} /></FormControl>
                      <FormDescription>{t("translation:createListing.startingBidPlaceholder")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="auctionEndDate" render={({ field }) => (
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
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="auctionEndTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("translation:createListing.auctionEndTime")}</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </Card>
            )}

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/my-listings")} className="flex-1">
                {t("translation:common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("translation:createListing.saving")}
                  </>
                ) : (
                  t("translation:createListing.saveChanges")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
