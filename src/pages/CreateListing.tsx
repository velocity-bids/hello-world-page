import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Clock, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { IdVerificationModal } from "@/components/IdVerificationModal";
import CreateListingNavbar from "@/components/CreateListingNavbar";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useIdVerification } from "@/contexts/IdVerificationContext";
import { ListingPhotosProvider, useListingPhotos } from "@/contexts/ListingPhotosContext";
import { createVehicle } from "@/db/mutations";
import { useAuth } from "@/hooks/useAuth";
import { uploadFilesToUploadCare } from "@/lib/uploadcare";
import { cn } from "@/lib/utils";

import BasicInfoStep from "./create-listing/BasicInfoStep";
import DetailsStep from "./create-listing/DetailsStep";
import PhotosStep from "./create-listing/PhotosStep";
import ReviewStep from "./create-listing/ReviewStep";
import { listingSchema, type ListingForm } from "./create-listing/schema";

const totalSteps = 4;

export default function CreateListing() {
  return (
    <ListingPhotosProvider>
      <CreateListingInner />
    </ListingPhotosProvider>
  );
}

function CreateListingInner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal, isOpen: isModalOpen } = useAuthModal();
  const { isVerified, timeRemaining } = useIdVerification();
  const { files } = useListingPhotos();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { num: 1, label: t("translation:createListing.photos") },
    { num: 2, label: t("translation:createListing.basicInfo") },
    { num: 3, label: t("translation:createListing.details") },
    { num: 4, label: t("translation:createListing.review") },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
    }
  }, [user, authLoading, openLoginModal]);

  useEffect(() => {
    if (!authLoading && !user && !isModalOpen) {
      navigate("/");
    }
  }, [user, authLoading, isModalOpen, navigate]);

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
      toast.error(t("translation:createListing.mustBeLoggedIn"));
      openLoginModal();
      return;
    }

    if (!isVerified) {
      toast.error(t("translation:createListing.verifyIdFirst"));
      setVerificationModalOpen(true);
      return;
    }

    if (files.length < 5) {
      toast.error(t("translation:createListing.uploadFiveImages"));
      return;
    }

    setIsSubmitting(true);

    try {
      toast.loading(t("translation:createListing.uploadingImages"), { id: "uploading" });
      const photoUrls = await uploadFilesToUploadCare(files);
      toast.dismiss("uploading");
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
        images: photoUrls,
        image_url: photoUrls[0],
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

      toast.success(t("translation:createListing.submittedForReview"));
      navigate("/");
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error(t("translation:createListing.createFailed"));
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
      if (files.length < 5) {
        toast.error(t("translation:createListing.uploadFiveImages"));
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
      toast.error(t("translation:createListing.specifyImportCountry"));
      return;
    }

    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      nextStep();
    } else {
      toast.error(t("translation:createListing.completeRequiredFields"));
    }
  };

  if (authLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
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
    <>
      <CreateListingNavbar currentStep={currentStep} totalSteps={totalSteps} />

      <IdVerificationModal open={verificationModalOpen} onOpenChange={setVerificationModalOpen} />

      <div className="flex-1 bg-background px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-4xl font-bold">{t("translation:createListing.title")}</h1>

          <div
            className={cn(
              "mb-6 flex items-center gap-3 rounded-lg border p-4",
              isVerified
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
            )}
          >
            {isVerified ? (
              <>
                <ShieldCheck className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">{t("translation:createListing.idVerified")}</p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    {t("translation:createListing.canCreateAuctions")} {timeRemaining > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("translation:createListing.expiresInDemo", { count: timeRemaining })}
                      </span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{t("translation:createListing.idVerificationRequired")}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">{t("translation:createListing.verifyIdentityBeforeAuction")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setVerificationModalOpen(true)} className="shrink-0">
                  {t("translation:createListing.uploadId")}
                </Button>
              </>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-start justify-between gap-2">
              {steps.map((step) => (
                <div key={step.num} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    <div
                      className={cn(
                        "mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                        currentStep >= step.num
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground text-muted-foreground"
                      )}
                    >
                      {step.num}
                    </div>
                  </div>
                  <span className="mt-2 text-center text-xs text-muted-foreground">{step.label}</span>
                </div>
              ))}
            </div>
            <div className="-mx-4 mt-6 flex items-center">
              {steps.map((step) => (
                <div key={step.num} className={cn("mx-2 h-1 flex-1 transition-colors", currentStep > step.num ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {renderStep()}

              <div className="flex justify-between gap-4">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" size="lg" onClick={prevStep} disabled={isSubmitting}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("translation:common.previous")}
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < totalSteps ? (
                  <Button type="button" size="lg" onClick={handleNext} className={cn(currentStep === 1 && "ml-auto")}>
                    {t("translation:common.next")}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" size="lg" disabled={isSubmitting} className="ml-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("translation:createListing.creatingListingButton")}
                      </>
                    ) : (
                      t("translation:createListing.createListing")
                    )}
                  </Button>
                )}

              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
