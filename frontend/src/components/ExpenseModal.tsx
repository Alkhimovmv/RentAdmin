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
    amount: null,
    date: new Date().toISOString().split('T')[0],
    category: '',
  });

  useEffect(() => {
    if (isOpen) {
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
          amount: null,
          date: new Date().toISOString().split('T')[0],
          category: '',
        });
      }
    }
  }, [expense, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const categories = [
    'Покупка оборудования',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 sm:items-start sm:p-4 sm:pt-8 sm:pb-8 overflow-y-auto" style={{zIndex: 1000}}>
      <div className="bg-white shadow-xl w-full h-full sm:w-full sm:max-w-md sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:rounded-lg overflow-y-auto flex flex-col" style={{paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <div className="flex-1 flex flex-col p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {expense ? 'Редактировать расход' : 'Добавить новый расход'}
          </h3>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
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
                value={formData.amount ?? ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? null : Number(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Не указана"
                min="0"
                step="0.01"
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
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex flex-row justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium min-h-[44px] touch-manipulation"
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50 font-medium min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Сохранение...'
                ) : expense ? (
                  'Обновить'
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Добавить расход
                  </>
                )}
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