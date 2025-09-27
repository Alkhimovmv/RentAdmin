import React, { useState, useMemo } from 'react';
import { useAuthenticatedQuery } from '../hooks/useAuthenticatedQuery';
import { customersApi } from '../api/customers';
import type { Customer } from '../types/index';

const CustomersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customers = [], isLoading } = useAuthenticatedQuery<Customer[]>(
    ['customers'],
    customersApi.getAll
  );

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;

    const query = searchQuery.toLowerCase().trim();
    return customers.filter(customer =>
      customer.customer_name.toLowerCase().includes(query) ||
      customer.customer_phone.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-900">Список арендаторов</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Поиск по имени или телефону..."
            />
          </div>
          <div className="text-sm text-gray-600 whitespace-nowrap">
            {searchQuery ? `Найдено: ${filteredCustomers.length}` : `Всего: ${customers.length}`}
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredCustomers.map((customer, index) => (
              <div
                key={`${customer.customer_phone}-${index}`}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {customer.customer_name}
                    </h3>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        📞 {customer.customer_phone}
                      </span>
                      <span className="flex items-center">
                        📋 {customer.rental_count} {customer.rental_count === 1 ? 'аренда' : customer.rental_count < 5 ? 'аренды' : 'аренд'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      customer.rental_count >= 5
                        ? 'bg-green-100 text-green-800'
                        : customer.rental_count >= 3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.rental_count >= 5 ? '⭐ VIP клиент' : customer.rental_count >= 3 ? '👤 Постоянный' : '🆕 Новый'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && customers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет арендаторов</h3>
              <p className="text-gray-500">Арендаторы появятся после создания первых аренд</p>
            </div>
          )}

          {filteredCustomers.length === 0 && customers.length > 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ничего не найдено</h3>
              <p className="text-gray-500">Попробуйте изменить критерии поиска</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;