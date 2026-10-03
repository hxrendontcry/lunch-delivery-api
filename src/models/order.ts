export interface Order {
  id?: number;
  customer_id: number;
  box_count: number;
  note?: string;
  status?: 'pending' | 'delivering' | 'completed' | 'cancelled';
  is_simulated?: number;
  order_time?: string;
  // Join fields with Customer
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
}

export interface OrderInput {
  customer_id: number;
  box_count: number;
  note?: string;
}
