import { describe, it, expect } from 'vitest';
import { formatDate, formatDateShort, getStatusText, getStatusColor } from '../../utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats ISO date string correctly', () => {
      const dateString = '2024-12-20T15:30:00.000Z';
      const result = formatDate(dateString);

      // Result will vary based on timezone, so we just check it's formatted with comma separator
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/);
    });
  });

  describe('formatDateShort', () => {
    it('formats ISO date string to short format', () => {
      const dateString = '2024-12-20T15:30:00.000Z';
      const result = formatDateShort(dateString);

      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });
  });

  describe('getStatusText', () => {
    it('returns correct text for pending status', () => {
      expect(getStatusText('pending')).toBe('Ожидает');
    });

    it('returns correct text for active status', () => {
      expect(getStatusText('active')).toBe('Активна');
    });

    it('returns correct text for completed status', () => {
      expect(getStatusText('completed')).toBe('Завершена');
    });

    it('returns correct text for overdue status', () => {
      expect(getStatusText('overdue')).toBe('Просрочена');
    });

    it('returns original status for unknown status', () => {
      expect(getStatusText('unknown')).toBe('unknown');
    });
  });

  describe('getStatusColor', () => {
    it('returns correct color class for pending status', () => {
      expect(getStatusColor('pending')).toBe('status-pending');
    });

    it('returns correct color class for active status', () => {
      expect(getStatusColor('active')).toBe('status-active');
    });

    it('returns correct color class for completed status', () => {
      expect(getStatusColor('completed')).toBe('status-completed');
    });

    it('returns correct color class for overdue status', () => {
      expect(getStatusColor('overdue')).toBe('status-overdue');
    });

    it('returns default color class for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('status-pending');
    });
  });
});