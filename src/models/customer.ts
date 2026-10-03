export interface Customer {
  id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerInput {
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  latitude: number;
  longitude: number;
}
