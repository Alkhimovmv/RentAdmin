import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../../public/logo-header.png'

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isCompactMode, setIsCompactMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 900;
    }
    return false;
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const shouldBeCompact = width < 900;
      console.log('Screen width:', width, 'Compact mode:', shouldBeCompact);
      setIsCompactMode(shouldBeCompact);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
      <div className={`
        ${isCompactMode ? 'fixed z-50' : 'relative z-auto'}
        flex flex-col ${isCompactMode ? 'w-16' : 'w-64'} bg-white shadow-lg h-full
        transform transition-transform duration-300 ease-in-out
        translate-x-0
      `}>
        {/* Desktop Header */}
        <div className={`${!isCompactMode ? 'flex' : 'hidden'} items-center justify-center h-16 px-4 bg-indigo-600`}>
          <img src={logo} width={45} height={45} className="mr-5"/>
          <h1 className="text-xl font-bold text-white whitespace-nowrap">Возьми меня</h1>
        </div>

        {/* Mobile Header in Sidebar */}
        <div className={`${isCompactMode ? 'flex' : 'hidden'} items-center justify-center h-14 bg-indigo-600`}>
          <img src={logo} width={36} height={36}/>
        </div>

        <nav className={`flex-1 ${isCompactMode ? 'px-1' : 'px-4'} py-3 space-y-2`}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex ${isCompactMode ? 'justify-center px-2' : 'items-center px-4'} py-3 text-sm font-medium rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={item.label}
            >
              <span className={`${isCompactMode ? 'text-xl' : 'text-lg mr-3'}`}>{item.icon}</span>
              {!isCompactMode && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className={`${isCompactMode ? 'p-2' : 'p-4'} border-t`}>
          <button
            onClick={() => {
              logout();
            }}
            className={`flex ${isCompactMode ? 'justify-center px-2' : 'items-center px-4'} w-full py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900`}
            title="Выйти"
          >
            <span className={`${isCompactMode ? 'text-xl' : 'text-lg mr-3'}`}>🚪</span>
            {!isCompactMode && <span className="text-sm">Выйти</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 ${isCompactMode ? 'ml-16' : 'ml-0'} pb-safe`}>
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-6 sm:pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;