import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../../public/icon.jpg'

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { path: '/', label: 'Список аренд', icon: '📋' },
    { path: '/schedule', label: 'График аренд', icon: '📊' },
    { path: '/customers', label: 'Арендаторы', icon: '👥' },
    { path: '/equipment', label: 'Оборудование', icon: '🎥' },
    { path: '/finances', label: 'Финансы', icon: '💰' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 px-4 bg-indigo-600">
          <img src={logo} width={30} height={30} className='mr-5'/>
          <h1 className="text-xl font-bold text-white">Возьми меня</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900"
          >
            <span className="mr-3 text-lg">🚪</span>
            Выйти
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;