import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return `${value.toLocaleString("pt-PT")} €`;
}

interface VehicleLike {
  year?: number;
  make?: string;
  model?: string;
}

export function getVehicleTitle(vehicle: VehicleLike): string {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
}
