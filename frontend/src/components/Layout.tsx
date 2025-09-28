import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../../public/icon.jpg'

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-indigo-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <img src={logo} width={24} height={24} className="mr-2"/>
          <h1 className="text-lg font-bold text-white">Возьми меня</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:bg-indigo-700 p-2 rounded-md"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative lg:translate-x-0 z-50 lg:z-auto
        flex flex-col w-16 lg:w-64 bg-white shadow-lg h-full
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-center h-16 px-4 bg-indigo-600">
          <img src={logo} width={30} height={30} className="mr-5"/>
          <h1 className="text-xl font-bold text-white">Возьми меня</h1>
        </div>

        {/* Mobile Header in Sidebar */}
        <div className="lg:hidden flex items-center justify-center h-14 bg-indigo-600 relative">
          <img src={logo} width={24} height={24}/>
          <button
            onClick={closeMobileMenu}
            className="absolute top-2 right-2 text-white hover:bg-indigo-700 p-1 rounded-md"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-1 lg:px-4 py-3 lg:py-4 space-y-2 lg:space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={`flex lg:items-center justify-center lg:justify-start px-2 lg:px-4 py-3 lg:py-3 text-sm font-medium rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={item.label}
            >
              <span className="text-xl lg:text-lg lg:mr-3">{item.icon}</span>
              <span className="hidden lg:block text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-2 lg:p-4 border-t">
          <button
            onClick={() => {
              logout();
              closeMobileMenu();
            }}
            className="flex lg:items-center justify-center lg:justify-start w-full px-2 lg:px-4 py-3 lg:py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900"
            title="Выйти"
          >
            <span className="text-xl lg:text-lg lg:mr-3">🚪</span>
            <span className="hidden lg:block text-sm">Выйти</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 pt-16 lg:pt-0">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;