import { Request, Response } from 'express';
import db from '@/utils/database';
import { Rental, CreateRentalDto, UpdateRentalDto, RentalWithEquipment, RentalStatus } from '@/models/types';
import { createRecord, updateRecord } from '@/utils/dbHelpers';

export class RentalController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const equipment = await db('equipment').select('*');
      const rawRentals = await db('rentals').select('*').orderBy('start_date', 'desc');

      // Формируем аренды с названиями оборудования
      const rentalsWithEquipment = rawRentals.map(rental => {
        // Извлекаем реальный ID оборудования из виртуального
        const realEquipmentId = rental.equipment_id > 1000
          ? Math.floor(rental.equipment_id / 1000)
          : rental.equipment_id;

        // Найдем оборудование по реальному ID
        const baseEquipment = equipment.find(eq => eq.id === realEquipmentId);

        let equipment_name = 'Неизвестное оборудование';
        if (baseEquipment) {
          if (rental.equipment_id > 1000) {
            const instanceNumber = rental.equipment_id % 1000;
            equipment_name = `${baseEquipment.name} №${instanceNumber}`;
          } else {
            equipment_name = baseEquipment.name;
          }
        }

        return {
          ...rental,
          equipment_name
        };
      });

      const rentalsWithStatus = rentalsWithEquipment.map(rental => ({
        ...rental,
        status: this.calculateStatus(rental)
      }));

      res.json(rentalsWithStatus);
    } catch (error) {
      console.error('Error getting rentals:', error);
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

      const equipment = await db('equipment').select('*');

      let query = db('rentals').select('*');

      if (startDate && endDate) {
        query = query.whereRaw(
          'start_date <= ? AND end_date >= ?',
          [endDate, startDate]
        );
      }

      const ganttRentals = await query.orderBy('start_date');

      // Формируем аренды с названиями оборудования (аналогично getAll)
      const rentalsWithEquipment = ganttRentals.map(rental => {
        const realEquipmentId = rental.equipment_id > 1000
          ? Math.floor(rental.equipment_id / 1000)
          : rental.equipment_id;

        const baseEquipment = equipment.find(eq => eq.id === realEquipmentId);

        let equipment_name = 'Неизвестное оборудование';
        if (baseEquipment) {
          if (rental.equipment_id > 1000) {
            const instanceNumber = rental.equipment_id % 1000;
            equipment_name = `${baseEquipment.name} №${instanceNumber}`;
          } else {
            equipment_name = baseEquipment.name;
          }
        }

        return {
          ...rental,
          equipment_name
        };
      });

      const ganttData = rentalsWithEquipment.map(rental => ({
        ...rental,
        status: this.calculateStatus(rental)
      }));

      res.json(ganttData);
    } catch (error) {
      console.error('Error getting Gantt data:', error);
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