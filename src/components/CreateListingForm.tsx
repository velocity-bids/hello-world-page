import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BasePage } from "./BasePage";

const CreateVehicleForm = () => {
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    mileage: "",
    vin: "",
    description: "",
    reservePrice: "",
    auctionEndTime: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.make ||
      !formData.model ||
      !formData.year ||
      !formData.mileage ||
      !formData.auctionEndTime
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrls: string[] = [];

      for (const file of imageFiles) {
        const { data, error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(`vehicles/${Date.now()}_${file.name}`, file);

        if (uploadError) {
          throw uploadError;
        }

        const imageUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/vehicle-images/${data.path}`;
        imageUrls.push(imageUrl);
      }

      // Insert vehicle listing into the database
      const { error } = await supabase.from("vehicles").insert({
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year, 10),
        mileage: parseInt(formData.mileage, 10),
        vin: formData.vin || null,
        description: formData.description || null,
        reserve_price: formData.reservePrice
          ? parseFloat(formData.reservePrice)
          : null,
        auction_end_time: formData.auctionEndTime,
        image_urls: imageUrls, 
        status: "active",
      });

      if (error) {
        throw error;
      }

      toast.success("Vehicle listing created successfully!");
      setFormData({
        make: "",
        model: "",
        year: "",
        mileage: "",
        vin: "",
        description: "",
        reservePrice: "",
        auctionEndTime: "",
      });
      setImageFiles([]);
    } catch (error) {
      toast.error(error.message || "Failed to create vehicle listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BasePage>
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 items-end justify-between">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                Create Vehicle Listing
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    name="make"
                    placeholder="e.g., Toyota"
                    value={formData.make}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    placeholder="e.g., Corolla"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    placeholder="e.g., 2020"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    name="mileage"
                    type="number"
                    placeholder="e.g., 15000"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (Optional)</Label>
                  <Input
                    id="vin"
                    name="vin"
                    placeholder="e.g., 1HGCM82633A123456"
                    value={formData.vin}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Provide details about the vehicle..."
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reservePrice">Reserve Price (Optional)</Label>
                  <Input
                    id="reservePrice"
                    name="reservePrice"
                    type="number"
                    placeholder="e.g., 20000"
                    value={formData.reservePrice}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auctionEndTime">Auction End Time</Label>
                  <Input
                    id="auctionEndTime"
                    name="auctionEndTime"
                    type="datetime-local"
                    value={formData.auctionEndTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="images">Upload Images</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Create Listing"}
                </Button>
              </form>
            </Card>
        </div>
      </section>
    </BasePage>
  );
};

export default CreateVehicleForm;
