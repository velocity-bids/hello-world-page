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
  const specs = [
    { icon: <Calendar className="h-4 w-4" />, label: "Year", value: vehicle.year },
    { icon: <Gauge className="h-4 w-4" />, label: "Mileage", value: `${vehicle.mileage.toLocaleString()} km` },
    { icon: <Fuel className="h-4 w-4" />, label: "Fuel Type", value: vehicle.fuel_type },
    { icon: <Settings2 className="h-4 w-4" />, label: "Transmission", value: vehicle.transmission },
    { icon: <Zap className="h-4 w-4" />, label: "Horsepower", value: vehicle.horsepower ? `${vehicle.horsepower} HP` : null },
    { icon: <Hash className="h-4 w-4" />, label: "Engine", value: vehicle.engine_displacement ? `${vehicle.engine_displacement} cc` : null },
    { icon: <Palette className="h-4 w-4" />, label: "Exterior Color", value: vehicle.exterior_color },
    { icon: <Palette className="h-4 w-4" />, label: "Interior Color", value: vehicle.interior_color },
    { icon: <DoorOpen className="h-4 w-4" />, label: "Doors", value: vehicle.doors },
    { icon: <Users className="h-4 w-4" />, label: "Owners", value: vehicle.number_of_owners },
  ];

  const conditionSpecs = [
    { icon: <Globe className="h-4 w-4" />, label: "Imported", value: vehicle.imported ? `Yes (${vehicle.import_country || 'Unknown'})` : "No" },
    { icon: <BookOpen className="h-4 w-4" />, label: "Maintenance Book", value: vehicle.maintenance_book ? "Yes" : "No" },
    { icon: <Cigarette className="h-4 w-4" />, label: "Smoker Vehicle", value: vehicle.smoker ? "Yes" : "No" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-start justify-between">
          <div>
            {isActive && (
              <Badge className="mb-2 bg-accent">Live Auction</Badge>
            )}
            <h1 className="text-3xl font-bold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.vin && (
              <p className="text-sm text-muted-foreground mt-1">VIN: {vehicle.vin}</p>
            )}
          </div>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Specifications</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {specs.map((spec, index) => (
            <SpecItem key={index} {...spec} />
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Condition & History</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {conditionSpecs.map((spec, index) => (
            <SpecItem key={index} {...spec} />
          ))}
        </div>
      </Card>
    </div>
  );
};
