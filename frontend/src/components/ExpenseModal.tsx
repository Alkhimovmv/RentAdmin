import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Expense, type CreateExpenseDto } from '../types/index';
import CustomSelect from './CustomSelect';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExpenseDto) => void;
  expense?: Expense | null;
  isLoading?: boolean;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expense,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateExpenseDto>({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: '',
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount,
        date: expense.date.split('T')[0],
        category: expense.category || '',
      });
    } else {
      setFormData({
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: '',
      });
    }
  }, [expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const categories = [
    'Топливо',
    'Ремонт оборудования',
    'Реклама',
    'Аренда помещения',
    'Интернет и связь',
    'Упаковка и расходники',
    'Прочее',
  ];

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto" style={{zIndex: 1000}}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {expense ? 'Редактировать расход' : 'Добавить новый расход'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Описание расхода
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                placeholder="Например: Бензин для доставки"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Сумма (₽)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Дата
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Категория (опционально)
              </label>
              <CustomSelect
                value={formData.category || ''}
                onChange={(value) => setFormData({ ...formData, category: value })}
                options={[
                  { value: '', label: 'Выберите категорию' },
                  ...categories.map(cat => ({ value: cat, label: cat }))
                ]}
                placeholder="Выберите категорию"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Сохранение...' : expense ? 'Обновить' : 'Добавить расход'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ExpenseModal;