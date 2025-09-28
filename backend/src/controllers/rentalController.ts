import { Request, Response } from 'express';
import db from '@/utils/database';
import { Rental, CreateRentalDto, UpdateRentalDto, RentalWithEquipment, RentalStatus } from '@/models/types';
import { createRecord, updateRecord } from '@/utils/dbHelpers';

export class RentalController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const rentals: RentalWithEquipment[] = await db('rentals')
        .join('equipment', 'rentals.equipment_id', 'equipment.id')
        .select(
          'rentals.*',
          'equipment.name as equipment_name'
        )
        .orderBy('rentals.start_date', 'desc');

      const rentalsWithStatus = rentals.map(rental => ({
        ...rental,
        status: this.calculateStatus(rental)
      }));

      res.json(rentalsWithStatus);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения аренд' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rental: RentalWithEquipment | undefined = await db('rentals')
        .join('equipment', 'rentals.equipment_id', 'equipment.id')
        .select(
          'rentals.*',
          'equipment.name as equipment_name'
        )
        .where('rentals.id', id)
        .first();

      if (!rental) {
        res.status(404).json({ error: 'Аренда не найдена' });
        return;
      }

      rental.status = this.calculateStatus(rental);
      res.json(rental);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения аренды' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const rentalData: CreateRentalDto = req.body;
      const rental = await createRecord<Rental>('rentals', rentalData);
      res.status(201).json(rental);
    } catch (error) {
      console.error('Rental create error:', error);
      res.status(500).json({ error: 'Ошибка создания аренды' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateRentalDto = req.body;

      const rental = await updateRecord<Rental>('rentals', id, updateData);

      if (!rental) {
        res.status(404).json({ error: 'Аренда не найдена' });
        return;
      }

      res.json(rental);
    } catch (error) {
      console.error('Rental update error:', error);
      res.status(500).json({ error: 'Ошибка обновления аренды' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedCount = await db('rentals').where('id', id).del();

      if (deletedCount === 0) {
        res.status(404).json({ error: 'Аренда не найдена' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Ошибка удаления аренды' });
    }
  }

  async getGanttData(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      let query = db('rentals')
        .join('equipment', 'rentals.equipment_id', 'equipment.id')
        .select(
          'rentals.*',
          'equipment.name as equipment_name'
        );

      if (startDate && endDate) {
        query = query.whereRaw(
          'rentals.start_date <= ? AND rentals.end_date >= ?',
          [endDate, startDate]
        );
      }

      const rentals: RentalWithEquipment[] = await query.orderBy('rentals.start_date');

      const ganttData = rentals.map(rental => ({
        ...rental,
        status: this.calculateStatus(rental)
      }));

      res.json(ganttData);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения данных для диаграммы Ганта' });
    }
  }

  private calculateStatus(rental: Rental): RentalStatus {
    const now = new Date();
    const endDate = new Date(rental.end_date);
    const startDate = new Date(rental.start_date);

    if (rental.status === 'completed') {
      return 'completed';
    }

    if (now > endDate) {
      return 'overdue';
    }

    if (now >= startDate && now <= endDate) {
      return 'active';
    }

    return 'pending';
  }
}