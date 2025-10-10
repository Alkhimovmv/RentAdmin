export interface Equipment {
  id: number;
  name: string;
  quantity: number;
  description?: string;
  base_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentDto {
  name: string;
  quantity: number;
  description?: string;
  base_price: number | null;
}

export type RentalSource = 'авито' | 'сайт' | 'рекомендация' | 'карты';
export type RentalStatus = 'pending' | 'active' | 'completed' | 'overdue';

export interface Rental {
  id: number;
  equipment_id: number;
  start_date: string;
  end_date: string;
  customer_name: string;
  customer_phone: string;
  needs_delivery: boolean;
  delivery_address?: string;
  rental_price: number | null;
  delivery_price: number | null;
  delivery_costs: number | null;
  source: RentalSource;
  comment?: string;
  status: RentalStatus;
  total_price: number;
  profit: number;
  created_at: string;
  updated_at: string;
  equipment_name?: string;
  equipment_list?: Array<{ id: number; name: string }>; // Список оборудования для множественного выбора
}

export interface CreateRentalDto {
  equipment_id: number;
  equipment_ids?: number[]; // Новое поле для множественного выбора
  start_date: string;
  end_date: string;
  customer_name: string;
  customer_phone: string;
  needs_delivery: boolean;
  delivery_address?: string;
  rental_price: number | null;
  delivery_price?: number | null;
  delivery_costs?: number | null;
  source: RentalSource;
  comment?: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number | null;
  date: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseDto {
  description: string;
  amount: number | null;
  date: string;
  category?: string;
}

export interface Customer {
  customer_name: string;
  customer_phone: string;
  rental_count: number;
}

export interface FinancialSummary {
  total_revenue: number;
  rental_revenue: number;
  delivery_revenue: number;
  total_costs: number;
  delivery_costs: number;
  operational_expenses: number;
  net_profit: number;
  total_rentals: number;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  month_name: string;
  total_revenue: number;
  rental_count: number;
}

export interface EquipmentUtilization {
  id: number;
  name: string;
  quantity: number;
  total_rentals: number;
  total_revenue: number;
}