import React, { useState, useEffect } from 'react';
import { type Equipment, type CreateEquipmentDto } from '../types/index';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEquipmentDto) => void;
  equipment?: Equipment | null;
  isLoading?: boolean;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipment,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateEquipmentDto>({
    name: '',
    quantity: 1,
    description: '',
    base_price: null,
  });

  const [validationErrors, setValidationErrors] = useState<{
    name?: string | null;
  }>({});

  useEffect(() => {
    if (isOpen) {
      if (equipment) {
        setFormData({
          name: equipment.name,
          quantity: equipment.quantity,
          description: equipment.description || '',
          base_price: equipment.base_price,
        });
      } else {
        setFormData({
          name: '',
          quantity: 1,
          description: '',
          base_price: null,
        });
      }
      // Очищаем ошибки валидации при открытии
      setValidationErrors({});
    }
  }, [equipment, isOpen]);

  const isFormValid = () => {
    // Проверяем обязательное поле - название
    const hasName = formData.name.trim() !== '';
    return hasName;
  };

  const validateAllFields = () => {
    const errors: typeof validationErrors = {};

    // Валидация названия
    if (!formData.name.trim()) {
      errors.name = 'Необходимо указать название оборудования';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) {
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center z-50 sm:items-start sm:p-4 sm:pt-8 sm:pb-8">
      <div className="relative mx-auto border shadow-lg bg-white w-full h-full sm:w-11/12 sm:max-w-md sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:rounded-md overflow-y-auto flex flex-col" style={{paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <div className="flex-1 flex flex-col p-4 sm:p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {equipment ? 'Редактировать оборудование' : 'Добавить новое оборудование'}
          </h3>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Название оборудования
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  // Очищаем ошибку при вводе
                  if (e.target.value.trim()) {
                    setValidationErrors(prev => ({ ...prev, name: null }));
                  }
                }}
                className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                placeholder="Например: GoPro 13"
              />
              {validationErrors.name && (
                <div className="text-red-600 text-sm mt-1">
                  {validationErrors.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Количество
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Цена оборудования (₽)
              </label>
              <input
                type="number"
                value={formData.base_price ?? ''}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value === '' ? null : Number(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Не указана"
                min="0"
                step="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Краткое описание оборудования..."
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:opacity-50 font-medium min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? (
                  'Сохранение...'
                ) : equipment ? (
                  'Обновить'
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Создать
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentModal;