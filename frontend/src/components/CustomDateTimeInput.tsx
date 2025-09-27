import React, { useState, useRef, useEffect } from 'react';

interface CustomDateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

const CustomDateTimeInput: React.FC<CustomDateTimeInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const formatted = date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex justify-between items-center">
          <span className={displayValue ? 'text-gray-900' : 'text-gray-500'}>
            {displayValue || 'Выберите дату и время'}
          </span>
          <svg className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
          <input
            type="datetime-local"
            value={value}
            onChange={handleDateTimeChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required={required}
          />
        </div>
      )}
    </div>
  );
};

export default CustomDateTimeInput;