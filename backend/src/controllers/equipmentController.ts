import { Request, Response } from 'express';
import db from '@/utils/database';
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
      const [equipment]: Equipment[] = await db('equipment').insert(equipmentData).returning('*');
      res.status(201).json(equipment);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка создания оборудования' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateEquipmentDto = req.body;

      const [equipment]: Equipment[] = await db('equipment')
        .where('id', id)
        .update(updateData)
        .returning('*');

      if (!equipment) {
        res.status(404).json({ error: 'Оборудование не найдено' });
        return;
      }

      res.json(equipment);
    } catch (error) {
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
}