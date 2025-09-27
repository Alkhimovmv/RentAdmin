import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '../hooks/useAuthenticatedQuery';
import { analyticsApi } from '../api/analytics';
import { expensesApi } from '../api/expenses';
import { type CreateExpenseDto, type Expense, type MonthlyRevenue, type FinancialSummary } from '../types/index';
import { formatDateShort } from '../utils/dateUtils';
import ExpenseModal from '../components/ExpenseModal';
import CustomSelect from '../components/CustomSelect';

const FinancesPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const queryClient = useQueryClient();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [filterYear, filterMonth] = selectedMonth
    ? selectedMonth.split('-').map(Number)
    : [currentYear, currentMonth];

  const { data: monthlyRevenue = [] } = useAuthenticatedQuery<MonthlyRevenue[]>(
    ['analytics', 'monthly-revenue'],
    analyticsApi.getMonthlyRevenue
  );

  const { data: financialSummary } = useAuthenticatedQuery<FinancialSummary>(
    ['analytics', 'financial-summary', filterYear, filterMonth],
    () => analyticsApi.getFinancialSummary(filterYear, filterMonth),
    {
      enabled: !!filterYear && !!filterMonth,
    }
  );

  const { data: expenses = [] } = useAuthenticatedQuery<Expense[]>(
    ['expenses'],
    expensesApi.getAll
  );

  const createExpenseMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsExpenseModalOpen(false);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateExpenseDto> }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const handleCreateExpense = (data: CreateExpenseDto) => {
    createExpenseMutation.mutate(data);
  };

  const handleUpdateExpense = (data: Partial<CreateExpenseDto>) => {
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data });
    }
  };

  const handleDeleteExpense = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот расход?')) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const value = `${currentYear}-${month.toString().padStart(2, '0')}`;
    const label = new Date(currentYear, i).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
    });
    return { value, label };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Финансовые итоги</h1>
        <div className="flex space-x-4">
          <CustomSelect
            value={selectedMonth || `${currentYear}-${currentMonth.toString().padStart(2, '0')}`}
            onChange={(value) => setSelectedMonth(value)}
            options={monthOptions}
            placeholder="Выберите месяц"
          />
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Добавить расход
          </button>
        </div>
      </div>

      {/* Финансовая сводка за выбранный месяц */}
      {financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {financialSummary.total_revenue.toLocaleString()}₽
            </div>
            <div className="text-sm text-green-600">Общий доход</div>
            <div className="text-xs text-gray-500 mt-1">
              Аренда: {financialSummary.rental_revenue.toLocaleString()}₽ +
              Доставка: {financialSummary.delivery_revenue.toLocaleString()}₽
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {financialSummary.total_costs.toLocaleString()}₽
            </div>
            <div className="text-sm text-red-600">Общие расходы</div>
            <div className="text-xs text-gray-500 mt-1">
              Доставка: {financialSummary.delivery_costs.toLocaleString()}₽ +
              Операционные: {financialSummary.operational_expenses.toLocaleString()}₽
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${
            financialSummary.net_profit >= 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className={`text-2xl font-bold ${
              financialSummary.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {financialSummary.net_profit.toLocaleString()}₽
            </div>
            <div className={`text-sm ${
              financialSummary.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              Чистая прибыль
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">
              {financialSummary.total_rentals}
            </div>
            <div className="text-sm text-gray-600">Количество аренд</div>
          </div>
        </div>
      )}

      {/* Помесячная динамика */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Помесячная динамика</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {monthlyRevenue.slice(0, 6).map((item) => (
              <div key={`${item.year}-${item.month}`} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-gray-900">
                    {item.month_name} {item.year}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.rental_count} аренд
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {item.total_revenue.toLocaleString()}₽
                </div>
              </div>
            ))}
          </div>
          {monthlyRevenue.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Нет данных о доходах
            </div>
          )}
        </div>
      </div>

      {/* Список расходов */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Последние расходы</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {expenses.slice(0, 10).map((expense) => (
            <div key={expense.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {expense.description}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDateShort(expense.date)}
                  {expense.category && ` • ${expense.category}`}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-red-600">
                  -{expense.amount.toLocaleString()}₽
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditExpense(expense)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {expenses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Нет записей о расходах
          </div>
        )}
      </div>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
        expense={editingExpense}
        isLoading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
      />
    </div>
  );
};

export default FinancesPage;