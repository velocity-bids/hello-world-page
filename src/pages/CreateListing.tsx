import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useIdVerification } from "@/contexts/IdVerificationContext";
import { IdVerificationModal } from "@/components/IdVerificationModal";
import CreateListingNavbar from "@/components/CreateListingNavbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
import { CalendarIcon, Loader2, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/UploadCareWidget";
import { cn } from "@/lib/utils";

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
  startingBid: z.number().min(0).optional(),
  auctionEndDate: z.date({
    required_error: "Auction end date is required",
  }),
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

export default function CreateListing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { isVerified, timeRemaining } = useIdVerification();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
    }
  }, [user, authLoading, openLoginModal]);

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

  const onSubmit = async (data: ListingForm) => {
    if (!user) {
      toast.error("You must be logged in to create a listing");
      openLoginModal();
      return;
    }

    // Gate auction creation behind ID verification (mock)
    if (!isVerified) {
      toast.error("Please verify your ID before creating an auction");
      setVerificationModalOpen(true);
      return;
    }
    if (fileUrl.length < 5) {
      toast.error("Please upload at least 5 images");
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time into ISO string
      const [hours, minutes] = data.auctionEndTime.split(':');
      const auctionDateTime = new Date(data.auctionEndDate);
      auctionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

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
        starting_bid: data.startingBid || 0,
        auction_end_time: auctionDateTime.toISOString(),
        images: fileUrl,
        image_url: fileUrl[0], // Set first image as primary
        status: "active",
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

  const totalSteps = 5;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof ListingForm)[] = [];
    
    if (currentStep === 1) {
      if (fileUrl.length < 5) {
        toast.error("Please upload at least 5 images");
        return;
      }
      fieldsToValidate = ["make", "model", "year", "mileage"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["exteriorColor", "interiorColor", "fuelType", "transmission", "doors", "description"];
    } else if (currentStep === 3) {
      const imported = form.getValues("imported");
      if (imported && !form.getValues("importCountry")) {
        toast.error("Please specify the import country");
        return;
      }
    } else if (currentStep === 4) {
      fieldsToValidate = ["reservePrice", "auctionEndDate", "auctionEndTime"];
    }

    // Trigger validation for the current step's fields
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      nextStep();
    } else {
      toast.error("Please complete all required fields correctly");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <CreateListingNavbar currentStep={currentStep} totalSteps={totalSteps} />
      
      {/* ID Verification Modal (mock) */}
      <IdVerificationModal 
        open={verificationModalOpen} 
        onOpenChange={setVerificationModalOpen} 
      />
      
      <div className="flex-1 bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Create Vehicle Listing</h1>
          
          {/* ID Verification Status Banner */}
          <div className={cn(
            "mb-6 p-4 rounded-lg border flex items-center gap-3",
            isVerified 
              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" 
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
          )}>
            {isVerified ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    ID Verified
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    You can create auctions. {timeRemaining > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires in {timeRemaining}s (demo)
                      </span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    ID Verification Required
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    You must verify your identity before creating an auction.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setVerificationModalOpen(true)}
                  className="shrink-0"
                >
                  Upload ID
                </Button>
              </>
            )}
          </div>
        
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            {[
              { num: 1, label: "Images & Basic" },
              { num: 2, label: "Specifications" },
              { num: 3, label: "History" },
              { num: 4, label: "Auction" },
              { num: 5, label: "Review" }
            ].map((step, index) => (
              <div key={step.num} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors mx-auto",
                    currentStep >= step.num 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-muted-foreground text-muted-foreground"
                  )}>
                    {step.num}
                  </div>
                </div>
                <span className="mt-2 text-xs text-muted-foreground text-center">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center mt-6 -mx-4">
            {[1, 2, 3, 4,5].map((step) => (
              <div key={step} className={cn(
                "flex-1 h-1 mx-2 transition-colors",
                currentStep > step ? "bg-primary" : "bg-muted"
              )} />
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Images & Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="bg-card rounded-lg p-6 border">
                  <h2 className="text-xl font-semibold mb-4">Vehicle Images *</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload at least 5 images of your vehicle
                  </p>
                  <FileUploader onUploadComplete={setFileUrl} />
                  {fileUrl.length > 0 && (
                    <p className={cn("text-sm mt-2", fileUrl.length >= 5 ? "text-green-600" : "text-amber-600")}>
                      {fileUrl.length >= 5 ? '✓' : '⚠'} {fileUrl.length} of 5 minimum images uploaded
                    </p>
                  )}
                </div>

                <div className="bg-card rounded-lg p-6 border space-y-6">
                  <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
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
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                            <Input placeholder="Vehicle Identification Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Specifications */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="bg-card rounded-lg p-6 border space-y-6">
                  <h2 className="text-xl font-semibold mb-4">Vehicle Specifications</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="exteriorColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exterior Color</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Black" {...field} />
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
                            <Input placeholder="e.g., Beige" {...field} />
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
                              placeholder="e.g., 250"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
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
                          <FormLabel>Engine Displacement (cm³) (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 2000"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
                            />
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
                          <FormLabel>Engine Type (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., V6, Inline-4" {...field} />
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
                            <Input placeholder="e.g., Gasoline, Diesel, Electric" {...field} />
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
                            <Input placeholder="e.g., Automatic, Manual" {...field} />
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
                          <FormLabel>Number of Doors</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="2"
                              max="6"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                          Provide detailed information to help buyers make informed decisions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 3: History & Condition */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="bg-card rounded-lg p-6 border space-y-6">
                  <h2 className="text-xl font-semibold mb-4">Vehicle History & Condition</h2>
                  
                  <FormField
                    control={form.control}
                    name="imported"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Is this vehicle imported?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "true")}
                            value={field.value ? "true" : "false"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="not-imported" />
                              <Label htmlFor="not-imported">No</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="imported" />
                              <Label htmlFor="imported">Yes</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("imported") && (
                    <FormField
                      control={form.control}
                      name="importCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Import Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Germany, Japan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="maintenanceBook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Does it have maintenance book (livro de revisões)?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "true")}
                            value={field.value ? "true" : "false"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="no-book" />
                              <Label htmlFor="no-book">No</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="has-book" />
                              <Label htmlFor="has-book">Yes</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smoker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Was the owner a smoker?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "true")}
                            value={field.value ? "true" : "false"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="non-smoker" />
                              <Label htmlFor="non-smoker">No</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="smoker" />
                              <Label htmlFor="smoker">Yes</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfOwners"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Known Owners (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Auction Details */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in-50 duration-500">
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
                  name="startingBid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Bid (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Minimum first bid amount"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        The minimum amount for the first bid (defaults to $0)
                      </FormDescription>
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
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select the date when the auction should end
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
                      <FormLabel>Auction End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        Select the time when the auction should end
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Summary */}
            {currentStep === 5 && (
              <div className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="bg-card rounded-lg p-6 border space-y-8">
                  <h2 className="text-2xl font-semibold mb-4">Review Your Listing</h2>
                  
                  {/* Images */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-primary">Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {fileUrl.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Vehicle ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-primary">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Make:</span>
                        <p className="font-medium">{form.getValues("make")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <p className="font-medium">{form.getValues("model")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Year:</span>
                        <p className="font-medium">{form.getValues("year")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mileage:</span>
                        <p className="font-medium">{form.getValues("mileage").toLocaleString()} km</p>
                      </div>
                      {form.getValues("vin") && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">VIN:</span>
                          <p className="font-medium">{form.getValues("vin")}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-primary">Specifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Exterior Color:</span>
                        <p className="font-medium">{form.getValues("exteriorColor")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interior Color:</span>
                        <p className="font-medium">{form.getValues("interiorColor")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fuel Type:</span>
                        <p className="font-medium">{form.getValues("fuelType")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transmission:</span>
                        <p className="font-medium">{form.getValues("transmission")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Doors:</span>
                        <p className="font-medium">{form.getValues("doors")}</p>
                      </div>
                      {form.getValues("horsepower") && (
                        <div>
                          <span className="text-muted-foreground">Horsepower:</span>
                          <p className="font-medium">{form.getValues("horsepower")} HP</p>
                        </div>
                      )}
                      {form.getValues("engineDisplacement") && (
                        <div>
                          <span className="text-muted-foreground">Engine:</span>
                          <p className="font-medium">{form.getValues("engineDisplacement")} cm³</p>
                        </div>
                      )}
                      {form.getValues("engineType") && (
                        <div>
                          <span className="text-muted-foreground">Engine Type:</span>
                          <p className="font-medium">{form.getValues("engineType")}</p>
                        </div>
                      )}
                    </div>
                    {form.getValues("description") && (
                      <div className="mt-4">
                        <span className="text-muted-foreground">Description:</span>
                        <p className="font-medium mt-1 whitespace-pre-wrap">{form.getValues("description")}</p>
                      </div>
                    )}
                  </div>

                  {/* History & Condition */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-primary">History & Condition</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Imported:</span>
                        <p className="font-medium">{form.getValues("imported") ? "Yes" : "No"}</p>
                      </div>
                      {form.getValues("imported") && form.getValues("importCountry") && (
                        <div>
                          <span className="text-muted-foreground">Import Country:</span>
                          <p className="font-medium">{form.getValues("importCountry")}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Maintenance Book:</span>
                        <p className="font-medium">{form.getValues("maintenanceBook") ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Smoker:</span>
                        <p className="font-medium">{form.getValues("smoker") ? "Yes" : "No"}</p>
                      </div>
                      {form.getValues("numberOfOwners") && (
                        <div>
                          <span className="text-muted-foreground">Number of Owners:</span>
                          <p className="font-medium">{form.getValues("numberOfOwners")}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Auction Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-primary">Auction Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Reserve Price:</span>
                        <p className="font-medium">€{form.getValues("reservePrice").toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Auction Ends:</span>
                        <p className="font-medium">
                          {form.getValues("auctionEndDate") && format(form.getValues("auctionEndDate"), "PPP")} at {form.getValues("auctionEndTime")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleNext}
                  className={cn(currentStep === 1 && "ml-auto")}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" size="lg" disabled={isSubmitting} className="ml-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Listing...
                    </>
                  ) : (
                    "Create Listing"
                  )}
                </Button>
              )}
              
              <Button
                type="button"
                variant="ghost"
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
    <Footer />
  </div>
  );
}
