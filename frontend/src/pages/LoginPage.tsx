import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [pinCode, setPinCode] = useState('');
  const { login, loginError, loginLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(pinCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Введите пин-код для доступа к системе аренды
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="pin-code" className="sr-only">
                Пин-код
              </label>
              <input
                id="pin-code"
                name="pinCode"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Введите пин-код"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                disabled={loginLoading}
              />
            </div>
          </div>

          {loginError ? (
            <div className="text-red-600 text-sm text-center">
              {loginError instanceof Error ? loginError.message : typeof loginError === 'string' ? loginError : 'Ошибка входа'}
            </div>
          ) : null}

          <div>
            <button
              type="submit"
              disabled={loginLoading || !pinCode}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;