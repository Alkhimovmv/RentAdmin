export interface Equipment {
  id: number;
  name: string;
  quantity: number;
  description?: string;
  base_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEquipmentDto {
  name: string;
  quantity: number;
  description?: string;
  base_price: number;
}

export interface UpdateEquipmentDto {
  name?: string;
  quantity?: number;
  description?: string;
  base_price?: number;
}

export type RentalSource = 'авито' | 'сайт' | 'рекомендация' | 'карты';
export type RentalStatus = 'pending' | 'active' | 'completed' | 'overdue';

export interface Rental {
  id: number;
  equipment_id: number;
  start_date: Date;
  end_date: Date;
  customer_name: string;
  customer_phone: string;
  needs_delivery: boolean;
  delivery_address?: string;
  rental_price: number;
  delivery_price: number;
  delivery_costs: number;
  source: RentalSource;
  comment?: string;
  status: RentalStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRentalDto {
  equipment_id: number;
  equipment_ids?: number[]; // Новое поле для множественного выбора
  start_date: Date;
  end_date: Date;
  customer_name: string;
  customer_phone: string;
  needs_delivery: boolean;
  delivery_address?: string;
  rental_price: number;
  delivery_price?: number;
  delivery_costs?: number;
  source: RentalSource;
  comment?: string;
}

export interface UpdateRentalDto {
  equipment_id?: number;
  equipment_ids?: number[]; // Новое поле для множественного выбора
  start_date?: Date;
  end_date?: Date;
  customer_name?: string;
  customer_phone?: string;
  needs_delivery?: boolean;
  delivery_address?: string;
  rental_price?: number;
  delivery_price?: number;
  delivery_costs?: number;
  source?: RentalSource;
  comment?: string;
  status?: RentalStatus;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: Date;
  category?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  date: Date;
  category?: string;
}

export interface UpdateExpenseDto {
  description?: string;
  amount?: number;
  date?: Date;
  category?: string;
}

export interface Customer {
  customer_name: string;
  customer_phone: string;
  rental_count: number;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  total_revenue: number;
  rental_count: number;
}

export interface RentalWithEquipment extends Rental {
  equipment_name: string;
  equipment_list?: Array<{ id: number; name: string }>; // Список оборудования для множественного выбора
}