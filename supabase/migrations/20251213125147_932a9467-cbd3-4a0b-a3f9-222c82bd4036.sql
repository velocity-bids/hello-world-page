-- Allow sellers to delete their own vehicles (only if no bids placed)
CREATE POLICY "Sellers can delete their own vehicles"
ON public.vehicles
FOR DELETE
USING (auth.uid() = seller_id AND (bid_count IS NULL OR bid_count = 0));