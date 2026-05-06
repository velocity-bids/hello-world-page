import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Gauge,
  Fuel,
  Palette,
  Settings2,
  DoorOpen,
  Globe,
  BookOpen,
  Cigarette,
  Users,
  Zap,
  Hash,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Vehicle } from "@/types";

interface VehicleInfoProps {
  vehicle: Vehicle;
  isActive: boolean;
}

interface SpecItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}

const SpecItem = ({ icon, label, value }: SpecItemProps) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
};

export const VehicleInfo = ({ vehicle, isActive }: VehicleInfoProps) => {
  const { t } = useTranslation();

  const specs = [
    { icon: <Calendar className="h-4 w-4" />, label: t("translation:vehicle.year"), value: vehicle.year },
    { icon: <Gauge className="h-4 w-4" />, label: t("translation:vehicle.mileage"), value: `${vehicle.mileage.toLocaleString()} km` },
    { icon: <Fuel className="h-4 w-4" />, label: t("translation:vehicle.fuelType"), value: vehicle.fuel_type },
    { icon: <Settings2 className="h-4 w-4" />, label: t("translation:vehicle.transmission"), value: vehicle.transmission },
    { icon: <Zap className="h-4 w-4" />, label: t("translation:vehicle.horsepower"), value: vehicle.horsepower ? `${vehicle.horsepower} HP` : null },
    { icon: <Hash className="h-4 w-4" />, label: t("translation:vehicle.engine"), value: vehicle.engine_displacement ? `${vehicle.engine_displacement} cc` : null },
    { icon: <Palette className="h-4 w-4" />, label: t("translation:vehicle.exteriorColor"), value: vehicle.exterior_color },
    { icon: <Palette className="h-4 w-4" />, label: t("translation:vehicle.interiorColor"), value: vehicle.interior_color },
    { icon: <DoorOpen className="h-4 w-4" />, label: t("translation:vehicle.doors"), value: vehicle.doors },
    { icon: <Users className="h-4 w-4" />, label: t("translation:vehicle.owners"), value: vehicle.number_of_owners },
  ];

  const conditionSpecs = [
    { icon: <Globe className="h-4 w-4" />, label: t("translation:createListing.imported"), value: vehicle.imported ? `${t("translation:vehicle.yes")} (${vehicle.import_country || t("translation:vehicle.unknown")})` : t("translation:vehicle.no") },
    { icon: <BookOpen className="h-4 w-4" />, label: t("translation:createListing.maintenanceBook"), value: vehicle.maintenance_book ? t("translation:vehicle.yes") : t("translation:vehicle.no") },
    { icon: <Cigarette className="h-4 w-4" />, label: t("translation:createListing.smoker"), value: vehicle.smoker ? t("translation:vehicle.yes") : t("translation:vehicle.no") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-start justify-between">
          <div>
            {isActive && (
              <Badge className="mb-2 bg-accent">{t("translation:vehicle.liveAuction")}</Badge>
            )}
            <h1 className="text-3xl font-bold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.vin && (
              <p className="text-sm text-muted-foreground mt-1">{t("translation:vehicle.vin")}: {vehicle.vin}</p>
            )}
          </div>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t("translation:vehicle.specifications")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {specs.map((spec, index) => (
            <SpecItem key={index} {...spec} />
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t("translation:vehicle.conditionAndHistory")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {conditionSpecs.map((spec, index) => (
            <SpecItem key={index} {...spec} />
          ))}
        </div>
      </Card>
    </div>
  );
};
