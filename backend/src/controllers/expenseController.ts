import { Request, Response } from 'express';
import db from '@/utils/database';
import { Expense, CreateExpenseDto, UpdateExpenseDto } from '@/models/types';

export class ExpenseController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const expenses: Expense[] = await db('expenses').select('*').orderBy('date', 'desc');
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения расходов' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const expense: Expense | undefined = await db('expenses').where('id', id).first();

      if (!expense) {
        res.status(404).json({ error: 'Расход не найден' });
        return;
      }

      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения расхода' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const expenseData: CreateExpenseDto = req.body;
      const [expense]: Expense[] = await db('expenses').insert(expenseData).returning('*');
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка создания расхода' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateExpenseDto = req.body;

      const [expense]: Expense[] = await db('expenses')
        .where('id', id)
        .update(updateData)
        .returning('*');

      if (!expense) {
        res.status(404).json({ error: 'Расход не найден' });
        return;
      }

      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка обновления расхода' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedCount = await db('expenses').where('id', id).del();

      if (deletedCount === 0) {
        res.status(404).json({ error: 'Расход не найден' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Ошибка удаления расхода' });
    }
  }
}