import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for ending auctions...');

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find auctions ending in the next 24 hours (for "ending soon" notifications)
    const { data: endingSoon, error: endingSoonError } = await supabase
      .from('vehicles')
      .select('id, make, model, year, auction_end_time, status')
      .eq('status', 'active')
      .gte('auction_end_time', now.toISOString())
      .lte('auction_end_time', twentyFourHoursFromNow.toISOString());

    if (endingSoonError) {
      console.error('Error fetching ending soon auctions:', endingSoonError);
    } else if (endingSoon && endingSoon.length > 0) {
      console.log(`Found ${endingSoon.length} auctions ending soon`);

      // Create notifications for watched vehicles ending soon
      for (const vehicle of endingSoon) {
        const { data: watchedBy } = await supabase
          .from('watched_vehicles')
          .select('user_id')
          .eq('vehicle_id', vehicle.id)
          .eq('notify_on_sale', true);

        if (watchedBy && watchedBy.length > 0) {
          const notifications = watchedBy.map(watch => ({
            user_id: watch.user_id,
            vehicle_id: vehicle.id,
            type: 'auction_ending',
            message: `Auction ending soon: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            metadata: { 
              auction_end_time: vehicle.auction_end_time,
              vehicle_make: vehicle.make,
              vehicle_model: vehicle.model 
            },
          }));

          // Check if notification already exists for this user/vehicle/type combo
          for (const notification of notifications) {
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', notification.user_id)
              .eq('vehicle_id', notification.vehicle_id)
              .eq('type', 'auction_ending')
              .single();

            if (!existing) {
              const { error: notifError } = await supabase
                .from('notifications')
                .insert(notification);

              if (notifError) {
                console.error('Error creating ending soon notification:', notifError);
              } else {
                console.log(`Created ending soon notification for vehicle ${vehicle.id}`);
              }
            }
          }
        }
      }
    }

    // Find auctions that have ended (past auction_end_time and still active)
    const { data: endedAuctions, error: endedError } = await supabase
      .from('vehicles')
      .select('id, make, model, year, auction_end_time, current_bid, status')
      .eq('status', 'active')
      .lt('auction_end_time', now.toISOString());

    if (endedError) {
      console.error('Error fetching ended auctions:', endedError);
    } else if (endedAuctions && endedAuctions.length > 0) {
      console.log(`Found ${endedAuctions.length} ended auctions to process`);

      for (const vehicle of endedAuctions) {
        // Update vehicle status to 'sold' if there were bids, otherwise 'ended'
        const newStatus = vehicle.current_bid && vehicle.current_bid > 0 ? 'sold' : 'ended';
        
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ status: newStatus })
          .eq('id', vehicle.id);

        if (updateError) {
          console.error('Error updating vehicle status:', updateError);
          continue;
        }

        console.log(`Updated vehicle ${vehicle.id} status to ${newStatus}`);

        // Create notifications for users watching this vehicle
        const { data: watchedBy } = await supabase
          .from('watched_vehicles')
          .select('user_id')
          .eq('vehicle_id', vehicle.id)
          .eq('notify_on_sale', true);

        if (watchedBy && watchedBy.length > 0) {
          const message = newStatus === 'sold' 
            ? `Auction sold: ${vehicle.year} ${vehicle.make} ${vehicle.model} for $${vehicle.current_bid.toLocaleString()}`
            : `Auction ended: ${vehicle.year} ${vehicle.make} ${vehicle.model} (no bids)`;

          const notifications = watchedBy.map(watch => ({
            user_id: watch.user_id,
            vehicle_id: vehicle.id,
            type: 'auction_ended',
            message,
            metadata: { 
              final_bid: vehicle.current_bid,
              status: newStatus,
              vehicle_make: vehicle.make,
              vehicle_model: vehicle.model 
            },
          }));

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (notifError) {
            console.error('Error creating notifications:', notifError);
          } else {
            console.log(`Created ${notifications.length} notifications for vehicle ${vehicle.id}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        endingSoonCount: endingSoon?.length || 0,
        endedCount: endedAuctions?.length || 0,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-auction-endings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
