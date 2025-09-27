import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '../hooks/useAuthenticatedQuery';
import { equipmentApi } from '../api/equipment';
import { type Equipment, type CreateEquipmentDto } from '../types/index';
import EquipmentModal from '../components/EquipmentModal';

const EquipmentPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const queryClient = useQueryClient();

  const { data: equipment = [], isLoading } = useAuthenticatedQuery<Equipment[]>(['equipment'], equipmentApi.getAll);

  const createMutation = useMutation({
    mutationFn: equipmentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateEquipmentDto> }) =>
      equipmentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsModalOpen(false);
      setEditingEquipment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: equipmentApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  const handleCreateEquipment = (data: CreateEquipmentDto) => {
    createMutation.mutate(data);
  };

  const handleUpdateEquipment = (data: Partial<CreateEquipmentDto>) => {
    if (editingEquipment) {
      updateMutation.mutate({ id: editingEquipment.id, data });
    }
  };

  const handleDeleteEquipment = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это оборудование?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsModalOpen(true);
  };

  const totalValue = equipment.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
  const totalItems = equipment.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Управление оборудованием</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Добавить оборудование
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{equipment.length}</div>
          <div className="text-sm text-gray-600">Типов оборудования</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
          <div className="text-sm text-gray-600">Единиц оборудования</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()}₽</div>
          <div className="text-sm text-gray-600">Общая стоимость</div>
        </div>
      </div>

      {/* Список оборудования */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="grid grid-cols-1 gap-1">
          {equipment.map((item) => (
            <div
              key={item.id}
              className="border-b border-gray-200 px-6 py-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.quantity > 5
                        ? 'bg-green-100 text-green-800'
                        : item.quantity > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.quantity} шт.
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    {item.description}
                  </div>

                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>💰 Цена оборудования: {item.base_price}₽</span>
                    <span>📊 Общая стоимость: {(item.base_price * item.quantity).toLocaleString()}₽</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditEquipment(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDeleteEquipment(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {equipment.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет оборудования</h3>
            <p className="text-gray-500">Добавьте первое оборудование для начала работы</p>
          </div>
        )}
      </div>

      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEquipment(null);
        }}
        onSubmit={editingEquipment ? handleUpdateEquipment : handleCreateEquipment}
        equipment={editingEquipment}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default EquipmentPage;