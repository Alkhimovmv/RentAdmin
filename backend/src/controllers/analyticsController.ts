import { Request, Response } from 'express';
import db from '@/utils/database';
import { MonthlyRevenue } from '@/models/types';

export class AnalyticsController {
  async getMonthlyRevenue(req: Request, res: Response): Promise<void> {
    try {
      const monthlyRevenue = await db('rentals')
        .select(
          db.raw('EXTRACT(YEAR FROM start_date) as year'),
          db.raw('EXTRACT(MONTH FROM start_date) as month'),
          db.raw('SUM(rental_price + delivery_price) as total_revenue'),
          db.raw('COUNT(*) as rental_count')
        )
        .groupByRaw('EXTRACT(YEAR FROM start_date), EXTRACT(MONTH FROM start_date)')
        .orderByRaw('year DESC, month DESC');

      const formattedData = monthlyRevenue.map((item: any) => ({
        year: parseInt(item.year),
        month: parseInt(item.month),
        total_revenue: parseFloat(item.total_revenue),
        rental_count: parseInt(item.rental_count),
        month_name: this.getMonthName(parseInt(item.month))
      }));

      res.json(formattedData);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения месячной выручки' });
    }
  }

  async getEquipmentUtilization(req: Request, res: Response): Promise<void> {
    try {
      const utilization = await db('equipment')
        .leftJoin('rentals', 'equipment.id', 'rentals.equipment_id')
        .select(
          'equipment.id',
          'equipment.name',
          'equipment.quantity',
          db.raw('COUNT(rentals.id) as total_rentals'),
          db.raw('COALESCE(SUM(rentals.rental_price), 0) as total_revenue')
        )
        .groupBy('equipment.id', 'equipment.name', 'equipment.quantity')
        .orderBy('total_revenue', 'desc');

      res.json(utilization);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения загрузки оборудования' });
    }
  }

  async getFinancialSummary(req: Request, res: Response): Promise<void> {
    try {
      const { year, month } = req.query;

      let rentalQuery = db('rentals')
        .select(
          db.raw('SUM(rental_price) as total_rental_revenue'),
          db.raw('SUM(delivery_price) as total_delivery_revenue'),
          db.raw('SUM(delivery_costs) as total_delivery_costs'),
          db.raw('COUNT(*) as total_rentals')
        );

      let expenseQuery = db('expenses')
        .select(db.raw('SUM(amount) as total_expenses'));

      if (year && month) {
        rentalQuery = rentalQuery.whereRaw(
          'EXTRACT(YEAR FROM start_date) = ? AND EXTRACT(MONTH FROM start_date) = ?',
          [year, month]
        );
        expenseQuery = expenseQuery.whereRaw(
          'EXTRACT(YEAR FROM date) = ? AND EXTRACT(MONTH FROM date) = ?',
          [year, month]
        );
      }

      const [rentalData] = await rentalQuery;
      const [expenseData] = await expenseQuery;

      const totalRevenue = (parseFloat(rentalData.total_rental_revenue) || 0) +
                          (parseFloat(rentalData.total_delivery_revenue) || 0);
      const totalCosts = (parseFloat(rentalData.total_delivery_costs) || 0) +
                        (parseFloat(expenseData.total_expenses) || 0);
      const netProfit = totalRevenue - totalCosts;

      res.json({
        total_revenue: totalRevenue,
        rental_revenue: parseFloat(rentalData.total_rental_revenue) || 0,
        delivery_revenue: parseFloat(rentalData.total_delivery_revenue) || 0,
        total_costs: totalCosts,
        delivery_costs: parseFloat(rentalData.total_delivery_costs) || 0,
        operational_expenses: parseFloat(expenseData.total_expenses) || 0,
        net_profit: netProfit,
        total_rentals: parseInt(rentalData.total_rentals) || 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения финансовой сводки' });
    }
  }

  private getMonthName(month: number): string {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[month - 1] || '';
  }
}