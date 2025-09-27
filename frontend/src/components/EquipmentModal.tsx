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
    base_price: 0,
  });

  const [validationErrors, setValidationErrors] = useState<{
    name?: string | null;
  }>({});

  useEffect(() => {
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
        base_price: 0,
      });
    }
  }, [equipment]);

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {equipment ? 'Редактировать оборудование' : 'Добавить новое оборудование'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                min="0"
                step="10"
                placeholder="0"
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? 'Сохранение...' : equipment ? 'Обновить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentModal;