import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpenseModal from '../ExpenseModal'
import type { Expense } from '../../types'

// Mock data
const mockExpense: Expense = {
  id: 1,
  description: 'Test Expense',
  amount: 500,
  date: '2024-01-01T00:00:00Z',
  category: 'Топливо',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Mock functions
const mockOnClose = vi.fn()
const mockOnSubmit = vi.fn()

describe('ExpenseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <ExpenseModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render create modal when no expense provided', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.getByText('Добавить новый расход')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /добавить расход/i })).toBeInTheDocument()
  })

  it('should render edit modal when expense provided', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        expense={mockExpense}
      />
    )

    expect(screen.getByText('Редактировать расход')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /обновить/i })).toBeInTheDocument()
  })

  it('should populate form fields when expense provided', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        expense={mockExpense}
      />
    )

    expect(screen.getByDisplayValue('Test Expense')).toBeInTheDocument()
    expect(screen.getByDisplayValue('500')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Топливо')).toBeInTheDocument()
  })

  it('should call onClose when cancel button clicked', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    await user.click(screen.getByRole('button', { name: /отмена/i }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Fill in the form
    await user.type(screen.getByLabelText(/описание расхода/i), 'New Expense')
    await user.clear(screen.getByLabelText(/сумма/i))
    await user.type(screen.getByLabelText(/сумма/i), '300')

    const dateInput = screen.getByLabelText(/дата/i)
    await user.clear(dateInput)
    await user.type(dateInput, '2024-01-15')

    // Submit form
    await user.click(screen.getByRole('button', { name: /добавить расход/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: 'New Expense',
        amount: 300,
        date: '2024-01-15',
        category: ''
      })
    })
  })

  it('should handle category selection', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Fill required fields
    await user.type(screen.getByLabelText(/описание расхода/i), 'Fuel expense')
    await user.clear(screen.getByLabelText(/сумма/i))
    await user.type(screen.getByLabelText(/сумма/i), '200')

    // Select category - find the select element and trigger change
    const categorySelect = screen.getByRole('combobox')
    fireEvent.change(categorySelect, { target: { value: 'Топливо' } })

    // Submit form
    await user.click(screen.getByRole('button', { name: /добавить расход/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: 'Fuel expense',
        amount: 200,
        date: expect.any(String),
        category: 'Топливо'
      })
    })
  })

  it('should require description field', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const descriptionInput = screen.getByLabelText(/описание расхода/i)
    expect(descriptionInput).toHaveAttribute('required')
  })

  it('should require amount field', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const amountInput = screen.getByLabelText(/сумма/i)
    expect(amountInput).toHaveAttribute('required')
    expect(amountInput).toHaveAttribute('min', '0')
    expect(amountInput).toHaveAttribute('step', '0.01')
  })

  it('should require date field', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const dateInput = screen.getByLabelText(/дата/i)
    expect(dateInput).toHaveAttribute('required')
  })

  it('should disable submit button during loading', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    )

    expect(screen.getByRole('button', { name: /сохранение.../i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /отмена/i })).toBeDisabled()
  })

  it('should show loading state text', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    )

    expect(screen.getByText('Сохранение...')).toBeInTheDocument()
  })

  it('should reset form when modal is closed and reopened', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Fill in some data
    await user.type(screen.getByLabelText(/описание расхода/i), 'Test Expense')

    // Close modal
    rerender(
      <ExpenseModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Reopen modal
    rerender(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Form should be reset
    expect(screen.getByLabelText(/описание расхода/i)).toHaveValue('')
  })

  it('should have proper form structure and accessibility', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Check form elements
    expect(screen.getByRole('form')).toBeInTheDocument()
    expect(screen.getByLabelText(/описание расхода/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/сумма/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/дата/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/категория/i)).toBeInTheDocument()

    // Check buttons
    expect(screen.getByRole('button', { name: /отмена/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /добавить расход/i })).toBeInTheDocument()
  })

  it('should handle numeric inputs correctly', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const amountInput = screen.getByLabelText(/сумма/i)

    // Test amount input
    await user.clear(amountInput)
    await user.type(amountInput, '1250.50')
    expect(amountInput).toHaveValue(1250.5)
  })

  it('should have correct input types', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.getByLabelText(/описание расхода/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/сумма/i)).toHaveAttribute('type', 'number')
    expect(screen.getByLabelText(/дата/i)).toHaveAttribute('type', 'date')
  })

  it('should show proper placeholders', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.getByPlaceholderText('Например: Бензин для доставки')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Выберите категорию')).toBeInTheDocument()
  })

  it('should default to current date', () => {
    const today = new Date().toISOString().split('T')[0]

    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const dateInput = screen.getByLabelText(/дата/i)
    expect(dateInput).toHaveValue(today)
  })

  it('should support all predefined categories', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // All categories should be available in the select
    const expectedCategories = [
      'Топливо',
      'Ремонт оборудования',
      'Реклама',
      'Аренда помещения',
      'Интернет и связь',
      'Упаковка и расходники',
      'Прочее'
    ]

    expectedCategories.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument()
    })
  })

  it('should have responsive mobile design', () => {
    const { container } = render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Check responsive classes
    const modalContainer = container.querySelector('.w-full.h-full.sm\\:w-full.sm\\:max-w-md')
    expect(modalContainer).toBeInTheDocument()

    // Check sticky bottom buttons
    const buttonContainer = container.querySelector('.sticky.bottom-0')
    expect(buttonContainer).toBeInTheDocument()
  })
})