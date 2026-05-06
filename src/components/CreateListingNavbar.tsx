import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Car, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CreateListingNavbarProps {
  currentStep: number;
  totalSteps: number;
}

const CreateListingNavbar = ({ currentStep, totalSteps }: CreateListingNavbarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          <span className="text-xl font-bold">{t("translation:nav.brandName")}</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span className="font-medium text-foreground">{t("translation:createListing.stepOf", { current: currentStep, total: totalSteps })}</span>
            <span>•</span>
            <span>{t("translation:createListing.creatingListing")}</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">{t("translation:common.cancel")}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("translation:createListing.cancelCreationTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("translation:createListing.cancelCreationDescription")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("translation:createListing.continueEditing")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => navigate("/")}>{t("translation:createListing.yesCancel")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </nav>
  );
};

export default CreateListingNavbar;
