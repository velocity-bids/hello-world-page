// Shared types for the application

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin: string | null;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  current_bid: number;
  bid_count: number;
  reserve_price: number | null;
  auction_end_time: string;
  status: string;
  approval_status?: string;
  admin_notes?: string | null;
  seller_id: string;
  created_at?: string;
  updated_at?: string;
  // Extended fields
  horsepower?: number | null;
  engine_type?: string | null;
  engine_displacement?: number | null;
  exterior_color?: string | null;
  interior_color?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  doors?: number | null;
  imported?: boolean | null;
  import_country?: string | null;
  maintenance_book?: boolean | null;
  smoker?: boolean | null;
  number_of_owners?: number | null;
}

export interface VehicleWithSeller extends Vehicle {
  profiles?: UserProfile | null;
}

export interface UserProfile {
  display_name: string | null;
  verified: boolean | null;
  avatar_url?: string | null;
  rating?: number | null;
  vehicles_sold?: number | null;
  member_since?: string | null;
}

export interface Bid {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
  vehicle_id?: string;
  profiles?: UserProfile | null;
}

export interface BidWithVehicle extends Bid {
  vehicle: Pick<Vehicle, 'id' | 'make' | 'model' | 'year' | 'image_url' | 'current_bid' | 'auction_end_time' | 'status'>;
}

export interface Comment {
  id: string;
  user_id: string;
  vehicle_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  profiles?: UserProfile | null;
}

export interface Notification {
  id: string;
  user_id: string;
  vehicle_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface Feedback {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  vehicle_id?: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_profile?: UserProfile | null;
}

// Feedback with reviewer info for display
export interface FeedbackWithReviewer {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    display_name: string;
    avatar_url: string | null;
  };
}
