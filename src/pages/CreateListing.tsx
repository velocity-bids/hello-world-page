import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2 } from "lucide-react";
import { FileUploader } from "@/components/UploadCareWidget";

const listingSchema = z.object({
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  mileage: z.number().min(0),
  vin: z.string().optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  reservePrice: z.number().min(0),
  auctionEndTime: z.string().min(1, "Auction end time is required"),
});

type ListingForm = z.infer<typeof listingSchema>;

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fileUrl, setFileUrl] = useState<string[]>([]);
  console.log("🚀 ~ CreateListing ~ fileUrl:", fileUrl)
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      auctionEndTime: "",
    },
  });

  const onSubmit = async (data: ListingForm) => {
    if (!user) {
      toast.error("You must be logged in to create a listing");
      navigate("/auth");
      return;
    }

    // if (images.length === 0) {
    //   toast.error("Please upload at least one image");
    //   return;
    // }

    setIsSubmitting(true);

    try {
      // Upload images to storage
      // const imageUrls: string[] = [];
      // for (let i = 0; i < images.length; i++) {
      //   const file = images[i];
      //   const fileExt = file.name.split(".").pop();
      //   const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

      //   const { error: uploadError } = await supabase.storage
      //     .from("vehicle-images")
      //     .upload(fileName, file);

      //   if (uploadError) throw uploadError;

      //   const {
      //     data: { publicUrl },
      //   } = supabase.storage.from("vehicle-images").getPublicUrl(fileName);

      //   imageUrls.push(publicUrl);
      // }


      // Create vehicle listing (defaults to pending approval)
      const { error: insertError } = await supabase.from("vehicles").insert({
        seller_id: user.id,
        make: data.make,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        vin: data.vin || null,
        description: data.description,
        reserve_price: data.reservePrice,
        auction_end_time: new Date(data.auctionEndTime).toISOString(),
        images: fileUrl,
        image_url: fileUrl[0], // Set first image as primary
        status: "active",
        // approval_status defaults to 'pending' in database
      });

      if (insertError) throw insertError;

      toast.success(
        "Listing submitted! It will be reviewed by our admin team before going live."
      );
      navigate("/");
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Please log in to create a listing
          </h2>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create Vehicle Listing</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Image Upload Section */}
            <FileUploader onUploadComplete={setFileUrl} />

            {/* Vehicle Information */}
            <div className="bg-card rounded-lg p-6 border space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Vehicle Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Toyota" {...field} />
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
                        <Input placeholder="e.g., Camry" {...field} />
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
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
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
                          placeholder="e.g., 50000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>VIN (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Vehicle Identification Number"
                          {...field}
                        />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the vehicle's condition, features, history..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide detailed information to help buyers make informed
                      decisions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Auction Details */}
            <div className="bg-card rounded-lg p-6 border space-y-6">
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
                          placeholder="Minimum acceptable price"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        The minimum price you're willing to accept
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auctionEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auction End Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        When should the auction end?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  "Create Listing"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
