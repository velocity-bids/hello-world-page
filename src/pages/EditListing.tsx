import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { getVehicleById } from "@/db/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/UploadCareWidget";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Vehicle } from "@/types";

const listingSchema = z.object({
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().min(0),
  vin: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  reservePrice: z.number().min(0),
  startingBid: z.number().min(0).optional(),
  auctionEndDate: z.date({ required_error: "Auction end date is required" }),
  auctionEndTime: z.string().min(1, "Auction end time is required"),
  horsepower: z.number().min(0).optional(),
  engineType: z.string().optional(),
  exteriorColor: z.string().min(1, "Exterior color is required"),
  interiorColor: z.string().min(1, "Interior color is required"),
  engineDisplacement: z.number().min(0).optional(),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  doors: z.number().min(2).max(6),
  imported: z.boolean(),
  importCountry: z.string().optional(),
  maintenanceBook: z.boolean(),
  smoker: z.boolean(),
  numberOfOwners: z.number().min(1).optional(),
});

type ListingForm = z.infer<typeof listingSchema>;

interface VehicleWithExtras extends Vehicle {
  starting_bid?: number;
}

export default function EditListing() {
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

  const form = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
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
        toast.error("Vehicle not found");
        navigate("/my-listings");
        return;
      }

      // Check if user owns this listing
      if (data.seller_id !== user?.id) {
        toast.error("You can only edit your own listings");
        navigate("/my-listings");
        return;
      }

      // Check if listing can be edited
      const hasBids = (data.bid_count || 0) > 0;
      const isPending = data.approval_status === "pending";
      
      if (hasBids) {
        // If has bids, only description and images can be edited
        setEditRestricted(true);
        setCanEdit(true);
      } else if (isPending || data.status === "active") {
        // Full edit allowed for pending or active with no bids
        setCanEdit(true);
      } else {
        toast.error("This listing cannot be edited");
        navigate("/my-listings");
        return;
      }

      setVehicle(data as VehicleWithExtras);
      setFileUrl(data.images || []);

      // Populate form with existing data
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
      toast.error("Failed to load vehicle");
      navigate("/my-listings");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ListingForm) => {
    if (!user || !vehicle) return;

    if (fileUrl.length < 5) {
      toast.error("Please keep at least 5 images");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build update object based on edit restrictions
      let updateData: Record<string, any> = {
        description: data.description,
        images: fileUrl,
        image_url: fileUrl[0],
      };

      // If not restricted, allow full updates
      if (!editRestricted) {
        const [hours, minutes] = data.auctionEndTime.split(":");
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

      const { error } = await supabase
        .from("vehicles")
        .update(updateData)
        .eq("id", vehicle.id);

      if (error) throw error;

      toast.success("Listing updated successfully!");
      navigate("/my-listings");
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Failed to update listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canEdit || !vehicle) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/my-listings")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Listings
          </Button>

          <h1 className="text-4xl font-bold mb-4">Edit Listing</h1>
          <p className="text-muted-foreground mb-8">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>

          {editRestricted && (
            <Alert className="mb-8" variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Limited Editing</AlertTitle>
              <AlertDescription>
                This auction has bids, so you can only edit the description and images.
                Other fields are locked to protect bidders.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Images Section */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Vehicle Images</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Keep at least 5 images of your vehicle
                </p>
                <FileUploader onUploadComplete={setFileUrl} />
                {fileUrl.length > 0 && (
                  <div className="mt-4">
                    <p className={cn("text-sm", fileUrl.length >= 5 ? "text-green-600" : "text-amber-600")}>
                      {fileUrl.length >= 5 ? "✓" : "⚠"} {fileUrl.length} images
                    </p>
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {fileUrl.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Vehicle ${index + 1}`}
                          className="h-20 w-full rounded object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Basic Information */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={editRestricted} />
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
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={editRestricted} />
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
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            disabled={editRestricted}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mileage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            disabled={editRestricted}
                          />
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
                        <FormLabel>VIN (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={editRestricted} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Specifications */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="exteriorColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exterior Color</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={editRestricted} />
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
                        <FormLabel>Interior Color</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={editRestricted} />
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
                        <FormLabel>Fuel Type</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={editRestricted} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transmission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transmission</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={editRestricted} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="doors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doors</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            disabled={editRestricted}
                          />
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
                        <FormLabel>Horsepower (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            disabled={editRestricted}
                          />
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
                        <FormLabel>Engine (cc) (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            disabled={editRestricted}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Description */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your vehicle in detail..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide detailed information about the vehicle's condition, features, and history.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>

              {/* Auction Details - Only show if not restricted */}
              {!editRestricted && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Auction Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="reservePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reserve Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Minimum acceptable price</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startingBid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Bid (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Minimum first bid amount</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="auctionEndDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Auction End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="auctionEndTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auction End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/my-listings")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
