import React from 'react';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

interface ReactDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

const ReactDateTimePicker: React.FC<ReactDateTimePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  className = ""
}) => {
  const selectedDate = value ? new Date(value) : null;

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const isoString = date.toISOString().slice(0, 16);
      onChange(isoString);
    } else {
      onChange('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <DateTimePicker
        value={selectedDate}
        onChange={handleDateChange}
        format="dd.MM.yyyy HH:mm"
        locale="ru-RU"
        clearIcon={null}
        calendarIcon={
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        disableClock={false}
        className="react-datetime-picker-custom"
        required={required}
      />
    </div>
  );
};

export default ReactDateTimePicker;