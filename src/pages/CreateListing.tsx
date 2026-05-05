import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Clock, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { IdVerificationModal } from "@/components/IdVerificationModal";
import CreateListingNavbar from "@/components/CreateListingNavbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useIdVerification } from "@/contexts/IdVerificationContext";
import { createVehicle } from "@/db/mutations";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

import BasicInfoStep from "./create-listing/BasicInfoStep";
import DetailsStep from "./create-listing/DetailsStep";
import PhotosStep from "./create-listing/PhotosStep";
import ReviewStep from "./create-listing/ReviewStep";
import { listingSchema, type ListingForm } from "./create-listing/schema";

const totalSteps = 4;

const steps = [
  { num: 1, label: "Photos" },
  { num: 2, label: "Basic Info" },
  { num: 3, label: "Details" },
  { num: 4, label: "Review" },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { isVerified, timeRemaining } = useIdVerification();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
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
      photos: [],
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

    if (!isVerified) {
      toast.error("Please verify your ID before creating an auction");
      setVerificationModalOpen(true);
      return;
    }

    if (data.photos.length < 5) {
      toast.error("Please upload at least 5 images");
      return;
    }

    setIsSubmitting(true);

    try {
      const [hours, minutes] = data.auctionEndTime.split(":");
      const auctionDateTime = new Date(data.auctionEndDate);
      auctionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error: insertError } = await createVehicle({
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
        images: data.photos,
        image_url: data.photos[0],
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

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((step) => step + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if ((form.getValues("photos") ?? []).length < 5) {
        toast.error("Please upload at least 5 images");
        return;
      }

      nextStep();
      return;
    }

    const fieldsToValidate: (keyof ListingForm)[] =
      currentStep === 2
        ? ["make", "model", "year"]
        : [
            "mileage",
            "exteriorColor",
            "interiorColor",
            "fuelType",
            "transmission",
            "doors",
            "description",
            "reservePrice",
            "auctionEndDate",
            "auctionEndTime",
          ];

    if (currentStep === 3 && form.getValues("imported") && !form.getValues("importCountry")) {
      toast.error("Please specify the import country");
      return;
    }

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PhotosStep />;
      case 2:
        return <BasicInfoStep />;
      case 3:
        return <DetailsStep />;
      case 4:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CreateListingNavbar currentStep={currentStep} totalSteps={totalSteps} />

      <IdVerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
      />

      <div className="flex-1 bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Create Vehicle Listing</h1>

          <div
            className={cn(
              "mb-6 p-4 rounded-lg border flex items-center gap-3",
              isVerified
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
            )}
          >
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

          <div className="mb-8">
            <div className="flex items-start justify-between gap-2">
              {steps.map((step) => (
                <div key={step.num} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors mx-auto",
                        currentStep >= step.num
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground text-muted-foreground"
                      )}
                    >
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
              {steps.map((step) => (
                <div
                  key={step.num}
                  className={cn(
                    "flex-1 h-1 mx-2 transition-colors",
                    currentStep > step.num ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {renderStep()}

              <div className="flex justify-between gap-4">
                {currentStep > 1 ? (
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
                ) : (
                  <div />
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
