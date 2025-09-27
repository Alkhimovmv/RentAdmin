import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '../hooks/useAuthenticatedQuery';
import { rentalsApi } from '../api/rentals';
import { equipmentApi } from '../api/equipment';
import type { Rental, CreateRentalDto, Equipment } from '../types/index';
import { formatDate, getStatusText, getStatusColor, getSourceText } from '../utils/dateUtils';
import RentalModal from '../components/RentalModal';
import CustomSelect from '../components/CustomSelect';
import { subDays, startOfDay, endOfDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

type DateFilter = 'week' | 'month' | 'all';

const RentalsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('week');
  const queryClient = useQueryClient();

  const { data: rentals = [], isLoading } = useAuthenticatedQuery<Rental[]>(['rentals'], rentalsApi.getAll);

  const { data: equipment = [] } = useAuthenticatedQuery<Equipment[]>(['equipment'], equipmentApi.getAll);

  // Фильтрация аренд по дате
  const filteredRentals = useMemo(() => {
    if (dateFilter === 'all') {
      return rentals;
    }

    const now = new Date();
    let dateRange: { start: Date; end: Date };

    if (dateFilter === 'week') {
      // Последние 7 дней
      dateRange = {
        start: startOfDay(subDays(now, 6)),
        end: endOfDay(now)
      };
    } else if (dateFilter === 'month') {
      // Текущий месяц
      dateRange = {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    } else {
      return rentals;
    }

    return rentals.filter(rental => {
      const rentalStart = new Date(rental.start_date);
      const rentalEnd = new Date(rental.end_date);

      // Проверяем, пересекается ли аренда с выбранным периодом
      return isWithinInterval(rentalStart, dateRange) ||
             isWithinInterval(rentalEnd, dateRange) ||
             (rentalStart <= dateRange.start && rentalEnd >= dateRange.end);
    });
  }, [rentals, dateFilter]);

  const createMutation = useMutation(rentalsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['rentals']);
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<CreateRentalDto & { status: string }> }) =>
      rentalsApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['rentals']);
        setIsModalOpen(false);
        setEditingRental(null);
      },
    }
  );

  const deleteMutation = useMutation(rentalsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(['rentals']);
    },
  });

  const handleCreateRental = (data: CreateRentalDto) => {
    createMutation.mutate(data);
  };

  const handleUpdateRental = (data: Partial<CreateRentalDto & { status: string }>) => {
    if (editingRental) {
      updateMutation.mutate({ id: editingRental.id, data });
    }
  };

  const handleCompleteRental = (rental: Rental) => {
    updateMutation.mutate({
      id: rental.id,
      data: { status: 'completed' },
    });
  };

  const handleDeleteRental = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту аренду?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditRental = (rental: Rental) => {
    setEditingRental(rental);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // const getFilterLabel = (filter: DateFilter) => {
  //   switch (filter) {
  //     case 'week': return 'Последние 7 дней';
  //     case 'month': return 'Текущий месяц';
  //     case 'all': return 'Все время';
  //     default: return 'Все время';
  //   }
  // };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Список аренд</h1>
          <div className="text-sm text-gray-600">
            Найдено: {filteredRentals.length} из {rentals.length}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Период:</label>
            <CustomSelect
              value={dateFilter}
              onChange={(value) => setDateFilter(value as DateFilter)}
              options={[
                { value: 'week', label: 'Последние 7 дней' },
                { value: 'month', label: 'Текущий месяц' },
                { value: 'all', label: 'Все время' }
              ]}
              placeholder="Выберите период"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Добавить аренду
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredRentals.map((rental) => (
            <li key={rental.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(rental.status)}`}>
                      {getStatusText(rental.status)}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {rental.equipment_name}
                      {rental.equipment_instance && (
                        <span className="ml-2 text-sm font-normal text-indigo-600">
                          №{rental.equipment_instance}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>👤 {rental.customer_name}</span>
                    <span>📞 {rental.customer_phone}</span>
                    <span>🕐 {formatDate(rental.start_date)} - {formatDate(rental.end_date)}</span>
                    <span>💰 {rental.rental_price}₽</span>
                    {rental.needs_delivery && (
                      <span className="text-blue-600">🚚 Доставка: {rental.delivery_price}₽</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>📊 {getSourceText(rental.source)}</span>
                    {rental.comment && <span className="ml-4">💬 {rental.comment}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {rental.status !== 'completed' && (
                    <button
                      onClick={() => handleCompleteRental(rental)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Завершить
                    </button>
                  )}
                  <button
                    onClick={() => handleEditRental(rental)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDeleteRental(rental.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {filteredRentals.length === 0 && rentals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных об аренде</h3>
            <p className="text-gray-500">Создайте первую аренду для начала работы</p>
          </div>
        )}
        {filteredRentals.length === 0 && rentals.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет аренд за выбранный период</h3>
            <p className="text-gray-500">Попробуйте изменить период фильтрации</p>
          </div>
        )}
      </div>

      <RentalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRental(null);
        }}
        onSubmit={editingRental ?
          (data) => handleUpdateRental(data as Partial<CreateRentalDto & { status: string }>) :
          (data) => handleCreateRental(data as CreateRentalDto)
        }
        rental={editingRental}
        equipment={equipment}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default RentalsPage;