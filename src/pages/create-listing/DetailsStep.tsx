import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { ListingForm } from "./schema";

function BooleanRadioField({
  name,
  label,
  falseLabel,
  trueLabel,
  falseId,
  trueId,
}: {
  name: "imported" | "maintenanceBook" | "smoker";
  label: string;
  falseLabel: string;
  trueLabel: string;
  falseId: string;
  trueId: string;
}) {
  const form = useFormContext<ListingForm>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={(value) => field.onChange(value === "true")}
              value={field.value ? "true" : "false"}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={falseId} />
                <Label htmlFor={falseId}>{falseLabel}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={trueId} />
                <Label htmlFor={trueId}>{trueLabel}</Label>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default function DetailsStep() {
  const form = useFormContext<ListingForm>();
  const imported = useWatch({ control: form.control, name: "imported" });

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="bg-card rounded-lg p-6 border space-y-6">
        <h2 className="text-xl font-semibold mb-4">Vehicle Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <FormItem>
                <FormLabel>VIN (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Vehicle Identification Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

      <div className="bg-card rounded-lg p-6 border space-y-6">
        <h2 className="text-xl font-semibold mb-4">Vehicle History & Condition</h2>

        <BooleanRadioField
          name="imported"
          label="Is this vehicle imported?"
          falseLabel="No"
          trueLabel="Yes"
          falseId="not-imported"
          trueId="imported"
        />

        {imported && (
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

        <BooleanRadioField
          name="maintenanceBook"
          label="Does it have maintenance book (livro de revisões)?"
          falseLabel="No"
          trueLabel="Yes"
          falseId="no-book"
          trueId="has-book"
        />

        <BooleanRadioField
          name="smoker"
          label="Was the owner a smoker?"
          falseLabel="No"
          trueLabel="Yes"
          falseId="non-smoker"
          trueId="smoker"
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
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
  );
}
