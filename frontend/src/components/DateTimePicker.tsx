import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale/ru';
import "react-datepicker/dist/react-datepicker.css";

registerLocale('ru', ru);

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
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
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        timeCaption="Время"
        dateFormat="dd.MM.yyyy HH:mm"
        locale="ru"
        placeholderText="Выберите дату и время"
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        wrapperClassName="w-full"
        required={required}
        withPortal
      />
    </div>
  );
};

export default DateTimePicker;