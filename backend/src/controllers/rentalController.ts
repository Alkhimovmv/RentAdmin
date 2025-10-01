import { Request, Response } from 'express';
import db from '@/utils/database';
import { Rental, CreateRentalDto, UpdateRentalDto, RentalWithEquipment, RentalStatus } from '@/models/types';
import { createRecord, updateRecord } from '@/utils/dbHelpers';

export class RentalController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const equipment = await db('equipment').select('*');
      const rawRentals = await db('rentals').select('*').orderBy('start_date', 'desc');

      console.log('🔍 RentalController.getAll - Equipment count:', equipment.length);
      console.log('🔍 RentalController.getAll - Raw rentals count:', rawRentals.length);
      if (rawRentals.length > 0) {
        console.log('🔍 RentalController.getAll - First rental:', rawRentals[0]);
      }

      // Получаем данные о множественном оборудовании
      const rentalEquipmentLinks = await db('rental_equipment').select('*');

      // Формируем аренды с названиями оборудования
      const rentalsWithEquipment = rawRentals.map(rental => {
        // Проверяем, есть ли связи в rental_equipment
        const equipmentLinks = rentalEquipmentLinks.filter(link => link.rental_id === rental.id);

        if (equipmentLinks.length > 0) {
          // Множественное оборудование
          const equipment_list = equipmentLinks.map(link => {
            // Извлекаем реальный ID из виртуального (4001 -> 4)
            const realEquipmentId = link.equipment_id > 1000
              ? Math.floor(link.equipment_id / 1000)
              : link.equipment_id;

            const eq = equipment.find(e => e.id === realEquipmentId);

            if (eq) {
              if (link.equipment_id > 1000) {
                const instanceNumber = link.equipment_id % 1000;
                return { id: link.equipment_id, name: `${eq.name} №${instanceNumber}` };
              }
              return { id: link.equipment_id, name: eq.name };
            }

            return { id: link.equipment_id, name: 'Неизвестное' };
          });

          const equipment_name = equipment_list.map(e => e.name).join(', ');

          return {
            ...rental,
            equipment_name,
            equipment_list
          };
        }

        // Старая логика для одиночного оборудования
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
      console.log('🎯 RentalController.create - Creating rental with data:', rentalData);

      // Если указан массив equipment_ids, создаем множественную аренду
      if (rentalData.equipment_ids && rentalData.equipment_ids.length > 0) {
        // Создаем базовую аренду
        const baseRentalData = { ...rentalData };
        delete baseRentalData.equipment_ids;

        // Используем первый ID как основной
        baseRentalData.equipment_id = rentalData.equipment_ids[0];

        const rental = await createRecord<Rental>('rentals', baseRentalData);

        // Добавляем связи для всех выбранных единиц оборудования
        const rentalEquipmentRecords = rentalData.equipment_ids.map(equipmentId => ({
          rental_id: rental.id,
          equipment_id: equipmentId
        }));

        await db('rental_equipment').insert(rentalEquipmentRecords);
        console.log('✅ RentalController.create - Multiple equipment rental created:', rental.id);

        res.status(201).json(rental);
      } else {
        // Обычная аренда с одним оборудованием
        const rental = await createRecord<Rental>('rentals', rentalData);
        console.log('✅ RentalController.create - Rental created successfully:', rental);

        res.status(201).json(rental);
      }
    } catch (error) {
      console.error('❌ Rental create error:', error);
      res.status(500).json({ error: 'Ошибка создания аренды' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateRentalDto = req.body;

      // Если указан массив equipment_ids, обновляем связи
      if (updateData.equipment_ids && updateData.equipment_ids.length > 0) {
        const baseUpdateData = { ...updateData };
        delete baseUpdateData.equipment_ids;

        // Используем первый ID как основной
        baseUpdateData.equipment_id = updateData.equipment_ids[0];

        const rental = await updateRecord<Rental>('rentals', id, baseUpdateData);

        if (!rental) {
          res.status(404).json({ error: 'Аренда не найдена' });
          return;
        }

        // Удаляем старые связи
        await db('rental_equipment').where('rental_id', id).del();

        // Добавляем новые связи
        const rentalEquipmentRecords = updateData.equipment_ids.map(equipmentId => ({
          rental_id: Number(id),
          equipment_id: equipmentId
        }));

        await db('rental_equipment').insert(rentalEquipmentRecords);
        console.log('✅ RentalController.update - Multiple equipment rental updated:', id);

        res.json(rental);
      } else {
        const rental = await updateRecord<Rental>('rentals', id, updateData);

        if (!rental) {
          res.status(404).json({ error: 'Аренда не найдена' });
          return;
        }

        res.json(rental);
      }
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

      // Получаем данные о множественном оборудовании
      const rentalEquipmentLinks = await db('rental_equipment').select('*');

      // Формируем записи для графика - каждая единица оборудования становится отдельной записью
      const ganttData: any[] = [];

      ganttRentals.forEach(rental => {
        // Проверяем, есть ли связи в rental_equipment
        const equipmentLinks = rentalEquipmentLinks.filter(link => link.rental_id === rental.id);

        if (equipmentLinks.length > 0) {
          // Множественное оборудование - создаем отдельную запись для каждой единицы
          equipmentLinks.forEach(link => {
            const realEquipmentId = link.equipment_id > 1000
              ? Math.floor(link.equipment_id / 1000)
              : link.equipment_id;

            const eq = equipment.find(e => e.id === realEquipmentId);

            let equipment_name = 'Неизвестное оборудование';
            if (eq) {
              if (link.equipment_id > 1000) {
                const instanceNumber = link.equipment_id % 1000;
                equipment_name = `${eq.name} №${instanceNumber}`;
              } else {
                equipment_name = eq.name;
              }
            }

            ganttData.push({
              ...rental,
              equipment_id: link.equipment_id,
              equipment_name,
              status: this.calculateStatus(rental)
            });
          });
        } else {
          // Старая логика для одиночного оборудования
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

          ganttData.push({
            ...rental,
            equipment_name,
            status: this.calculateStatus(rental)
          });
        }
      });

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