import * as z from "zod";

export const listingSchema = z.object({
  photos: z.array(z.string()).default([]),
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

export type ListingForm = z.infer<typeof listingSchema>;
