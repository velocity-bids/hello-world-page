-- Drop the old check constraint and add the updated one with new_listing_submitted type
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['new_bid'::text, 'auction_ending'::text, 'auction_ended'::text, 'new_listing_submitted'::text]));