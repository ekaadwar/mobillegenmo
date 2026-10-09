export interface CarImage {
  id: string;
  url: string;
}

export interface Car {
  id: string;
  name: string;
  manufacturer: string;
  year: number;
  price: number;
  description: string | null;
  status: string | null;
  color: string | null;
  transmission: string | null;
  mileage: number | null;
  validity_period: string | null;
  images: CarImage[];
}

export interface CarListResponse {
  data: Car[];
  page: number;
  perpage: number;
  total: number;
  totalPages: number;
}

export interface CarListParams {
  page?: number;
  perpage?: number;
  name?: string;
  start_year?: number;
  end_year?: number;
}