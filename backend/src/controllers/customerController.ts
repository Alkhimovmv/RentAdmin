import { Request, Response } from 'express';
import db from '@/utils/database';
import { Customer } from '@/models/types';

export class CustomerController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const customers = await db('rentals')
        .select('customer_name', 'customer_phone')
        .count('* as rental_count')
        .groupBy('customer_name', 'customer_phone')
        .orderBy('rental_count', 'desc');

      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения арендаторов' });
    }
  }

  async getCustomerRentals(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.params;

      const rentals = await db('rentals')
        .join('equipment', 'rentals.equipment_id', 'equipment.id')
        .select(
          'rentals.*',
          'equipment.name as equipment_name'
        )
        .where('rentals.customer_phone', phone)
        .orderBy('rentals.start_date', 'desc');

      res.json(rentals);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения аренд клиента' });
    }
  }
}