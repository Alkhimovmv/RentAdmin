import { Request, Response } from 'express';
import db from '@/utils/database';
import { createRecord, updateRecord } from '@/utils/dbHelpers';
import { Equipment, CreateEquipmentDto, UpdateEquipmentDto } from '@/models/types';

export class EquipmentController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const equipment: Equipment[] = await db('equipment').select('*').orderBy('name');
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения оборудования' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const equipment: Equipment | undefined = await db('equipment').where('id', id).first();

      if (!equipment) {
        res.status(404).json({ error: 'Оборудование не найдено' });
        return;
      }

      res.json(equipment);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения оборудования' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const equipmentData: CreateEquipmentDto = req.body;
      const equipment = await createRecord<Equipment>('equipment', equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      console.error('Equipment create error:', error);
      res.status(500).json({ error: 'Ошибка создания оборудования' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateEquipmentDto = req.body;

      const equipment = await updateRecord<Equipment>('equipment', id, updateData);

      if (!equipment) {
        res.status(404).json({ error: 'Оборудование не найдено' });
        return;
      }

      res.json(equipment);
    } catch (error) {
      console.error('Equipment update error:', error);
      res.status(500).json({ error: 'Ошибка обновления оборудования' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedCount = await db('equipment').where('id', id).del();

      if (deletedCount === 0) {
        res.status(404).json({ error: 'Оборудование не найдено' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Ошибка удаления оборудования' });
    }
  }

  // Получить оборудование с виртуальными экземплярами для аренды
  async getForRental(_req: Request, res: Response): Promise<void> {
    try {
      const equipment: Equipment[] = await db('equipment').select('*').orderBy('name');

      const equipmentInstances: Equipment[] = [];

      equipment.forEach(item => {
        if (item.quantity === 1) {
          // Если количество 1, добавляем как есть
          equipmentInstances.push(item);
        } else {
          // Если количество больше 1, создаем виртуальные экземпляры
          for (let i = 1; i <= item.quantity; i++) {
            equipmentInstances.push({
              ...item,
              id: item.id * 1000 + i, // Виртуальный ID для экземпляра
              name: `${item.name} №${i}`,
              quantity: 1
            });
          }
        }
      });

      res.json(equipmentInstances);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения оборудования для аренды' });
    }
  }
}