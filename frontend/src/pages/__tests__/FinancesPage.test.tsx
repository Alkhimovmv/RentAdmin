import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FinancesPage from '../FinancesPage'
import type { Expense, MonthlyRevenue, FinancialSummary } from '../../types'

// Mock data
const mockExpenses: Expense[] = [
  {
    id: 1,
    description: 'Бензин для доставки',
    amount: 1500,
    date: '2024-01-15T00:00:00Z',
    category: 'Топливо',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    description: 'Ремонт оборудования',
    amount: 3000,
    date: '2024-01-10T00:00:00Z',
    category: 'Ремонт оборудования',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  }
]

const mockMonthlyRevenue: MonthlyRevenue[] = [
  {
    year: 2024,
    month: 1,
    month_name: 'январь',
    total_revenue: 15000,
    rental_count: 5
  },
  {
    year: 2023,
    month: 12,
    month_name: 'декабрь',
    total_revenue: 12000,
    rental_count: 4
  }
]

const mockFinancialSummary: FinancialSummary = {
  total_revenue: 15000,
  rental_revenue: 12000,
  delivery_revenue: 3000,
  total_costs: 8000,
  delivery_costs: 2000,
  operational_expenses: 6000,
  net_profit: 7000,
  total_rentals: 5
}

// Mock API calls
const mockMutate = vi.fn()
const mockInvalidateQueries = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useMutation: () => ({
      mutate: mockMutate,
      isPending: false,
    }),
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  }
})

// Mock useAuthenticatedQuery
vi.mock('../../hooks/useAuthenticatedQuery', () => ({
  useAuthenticatedQuery: vi.fn((queryKey) => {
    if (queryKey[0] === 'expenses') {
      return {
        data: mockExpenses,
        isLoading: false,
        error: null,
      }
    }
    if (queryKey[0] === 'analytics' && queryKey[1] === 'monthly-revenue') {
      return {
        data: mockMonthlyRevenue,
        isLoading: false,
        error: null,
      }
    }
    if (queryKey[0] === 'analytics' && queryKey[1] === 'financial-summary') {
      return {
        data: mockFinancialSummary,
        isLoading: false,
        error: null,
      }
    }
    return {
      data: [],
      isLoading: false,
      error: null,
    }
  }),
}))

// Mock ExpenseModal
vi.mock('../../components/ExpenseModal', () => ({
  default: ({ isOpen, onClose, onSubmit }: any) => (
    isOpen ? (
      <div data-testid="expense-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onSubmit({
          description: 'Test Expense',
          amount: 500,
          date: '2024-01-15',
          category: 'Топливо'
        })}>Submit</button>
      </div>
    ) : null
  )
}))

// Mock confirm dialog
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
})

// Test wrapper with QueryClient
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('FinancesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  it('should render page title and add expense button', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    expect(screen.getByText('Финансовые итоги')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /добавить расход/i })).toBeInTheDocument()
  })

  it('should display financial summary cards', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    // Total revenue
    expect(screen.getByText('15\u00A0000₽')).toBeInTheDocument()
    expect(screen.getByText('Общий доход')).toBeInTheDocument()
    expect(screen.getByText('Аренда: 12\u00A0000₽')).toBeInTheDocument()
    expect(screen.getByText('Доставка: 3\u00A0000₽')).toBeInTheDocument()

    // Total costs
    expect(screen.getByText('8\u00A0000₽')).toBeInTheDocument()
    expect(screen.getByText('Общие расходы')).toBeInTheDocument()
    expect(screen.getByText('Доставка: 2\u00A0000₽')).toBeInTheDocument()
    expect(screen.getByText('Операционные: 6\u00A0000₽')).toBeInTheDocument()

    // Net profit
    expect(screen.getByText('7\u00A0000₽')).toBeInTheDocument()
    expect(screen.getByText('Чистая прибыль')).toBeInTheDocument()

    // Total rentals
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Количество аренд')).toBeInTheDocument()
  })

  it('should display monthly revenue data', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    expect(screen.getByText('Помесячная динамика')).toBeInTheDocument()
    expect(screen.getByText('январь 2024')).toBeInTheDocument()
    expect(screen.getByText('декабрь 2023')).toBeInTheDocument()
    expect(screen.getByText('5 аренд')).toBeInTheDocument()
    expect(screen.getByText('4 аренды')).toBeInTheDocument()
  })

  it('should display expenses list', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    expect(screen.getByText('Последние расходы')).toBeInTheDocument()
    expect(screen.getByText('Бензин для доставки')).toBeInTheDocument()
    expect(screen.getByText('Ремонт оборудования')).toBeInTheDocument()
    expect(screen.getByText('-1\u00A0500₽')).toBeInTheDocument()
    expect(screen.getByText('-3\u00A0000₽')).toBeInTheDocument()
  })

  it('should show expense categories', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    expect(screen.getByText(/• Топливо/)).toBeInTheDocument()
    expect(screen.getByText(/• Ремонт оборудования/)).toBeInTheDocument()
  })

  it('should show edit and delete buttons for expenses', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    const editButtons = screen.getAllByText('Изменить')
    const deleteButtons = screen.getAllByText('Удалить')

    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
  })

  it('should open modal when add expense button clicked', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /добавить расход/i }))

    expect(screen.getByTestId('expense-modal')).toBeInTheDocument()
  })

  it('should open edit modal when edit button clicked', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    const editButtons = screen.getAllByText('Изменить')
    await user.click(editButtons[0])

    expect(screen.getByTestId('expense-modal')).toBeInTheDocument()
  })

  it('should handle expense deletion with confirmation', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    const deleteButtons = screen.getAllByText('Удалить')
    await user.click(deleteButtons[0])

    expect(mockConfirm).toHaveBeenCalledWith('Вы уверены, что хотите удалить этот расход?')
    expect(mockMutate).toHaveBeenCalledWith(1)
  })

  it('should not delete when user cancels confirmation', async () => {
    mockConfirm.mockReturnValue(false)
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    const deleteButtons = screen.getAllByText('Удалить')
    await user.click(deleteButtons[0])

    expect(mockConfirm).toHaveBeenCalled()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('should handle form submission for creating expense', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    // Open modal
    await user.click(screen.getByRole('button', { name: /добавить расход/i }))

    // Submit form
    await user.click(screen.getByText('Submit'))

    expect(mockMutate).toHaveBeenCalledWith({
      description: 'Test Expense',
      amount: 500,
      date: '2024-01-15',
      category: 'Топливо'
    })
  })

  it('should invalidate queries after successful operations', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    // Test delete
    const deleteButtons = screen.getAllByText('Удалить')
    await user.click(deleteButtons[0])

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['expenses'] })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['analytics'] })
  })

  it('should close modal when close button clicked', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    // Open modal
    await user.click(screen.getByRole('button', { name: /добавить расход/i }))
    expect(screen.getByTestId('expense-modal')).toBeInTheDocument()

    // Close modal
    await user.click(screen.getByText('Close Modal'))

    await waitFor(() => {
      expect(screen.queryByTestId('expense-modal')).not.toBeInTheDocument()
    })
  })

  it('should show month selector', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should show empty state when no expenses', () => {
    // Mock empty expenses
    vi.mocked(require('../../hooks/useAuthenticatedQuery').useAuthenticatedQuery).mockImplementation((queryKey) => {
      if (queryKey[0] === 'expenses') {
        return {
          data: [],
          isLoading: false,
          error: null,
        }
      }
      if (queryKey[0] === 'analytics' && queryKey[1] === 'monthly-revenue') {
        return {
          data: [],
          isLoading: false,
          error: null,
        }
      }
      if (queryKey[0] === 'analytics' && queryKey[1] === 'financial-summary') {
        return {
          data: mockFinancialSummary,
          isLoading: false,
          error: null,
        }
      }
      return {
        data: [],
        isLoading: false,
        error: null,
      }
    })

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    expect(screen.getByText('Нет записей о расходах')).toBeInTheDocument()
    expect(screen.getByText('Нет данных о доходах')).toBeInTheDocument()
  })

  it('should show correct profit color for positive profit', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    const profitCard = screen.getByText('7\u00A0000₽').closest('div')
    expect(profitCard).toHaveClass('bg-blue-50', 'border-blue-200')
  })

  it('should show correct profit color for negative profit', () => {
    // Mock negative profit
    const negativeFinancialSummary = {
      ...mockFinancialSummary,
      net_profit: -2000
    }

    vi.mocked(require('../../hooks/useAuthenticatedQuery').useAuthenticatedQuery).mockImplementation((queryKey) => {
      if (queryKey[0] === 'expenses') {
        return {
          data: mockExpenses,
          isLoading: false,
          error: null,
        }
      }
      if (queryKey[0] === 'analytics' && queryKey[1] === 'monthly-revenue') {
        return {
          data: mockMonthlyRevenue,
          isLoading: false,
          error: null,
        }
      }
      if (queryKey[0] === 'analytics' && queryKey[1] === 'financial-summary') {
        return {
          data: negativeFinancialSummary,
          isLoading: false,
          error: null,
        }
      }
      return {
        data: [],
        isLoading: false,
        error: null,
      }
    })

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    const profitCard = screen.getByText('-2\u00A0000₽').closest('div')
    expect(profitCard).toHaveClass('bg-orange-50', 'border-orange-200')
  })

  it('should have proper responsive design classes', () => {
    const { container } = render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    // Check responsive spacing
    expect(container.querySelector('.space-y-4.sm\\:space-y-6')).toBeInTheDocument()

    // Check responsive grid
    expect(container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    // Main heading
    expect(screen.getByRole('heading', { level: 1, name: /финансовые итоги/i })).toBeInTheDocument()

    // Section headings
    expect(screen.getByRole('heading', { level: 3, name: /помесячная динамика/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /последние расходы/i })).toBeInTheDocument()

    // Buttons should be focusable
    const addButton = screen.getByRole('button', { name: /добавить расход/i })
    expect(addButton).toHaveAttribute('type', 'button')
  })

  it('should handle month selection', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    const monthSelect = screen.getByRole('combobox')
    expect(monthSelect).toBeInTheDocument()

    // The select should have current month selected by default
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    const expectedValue = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`

    expect(monthSelect).toHaveValue(expectedValue)
  })

  it('should display dates in short format', () => {
    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    // Check that dates are displayed (exact format depends on formatDateShort implementation)
    expect(screen.getByText(/15\.01\.2024|2024-01-15|15 января/)).toBeInTheDocument()
    expect(screen.getByText(/10\.01\.2024|2024-01-10|10 января/)).toBeInTheDocument()
  })

  it('should limit expenses display to 10 items', () => {
    // Mock with more than 10 expenses
    const manyExpenses = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      description: `Expense ${i + 1}`,
      amount: 100 + i,
      date: '2024-01-15T00:00:00Z',
      category: 'Топливо',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    }))

    vi.mocked(require('../../hooks/useAuthenticatedQuery').useAuthenticatedQuery).mockImplementation((queryKey) => {
      if (queryKey[0] === 'expenses') {
        return {
          data: manyExpenses,
          isLoading: false,
          error: null,
        }
      }
      if (queryKey[0] === 'analytics' && queryKey[1] === 'monthly-revenue') {
        return {
          data: mockMonthlyRevenue,
          isLoading: false,
          error: null,
        }
      }
      if (queryKey[0] === 'analytics' && queryKey[1] === 'financial-summary') {
        return {
          data: mockFinancialSummary,
          isLoading: false,
          error: null,
        }
      }
      return {
        data: [],
        isLoading: false,
        error: null,
      }
    })

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    // Should show only first 10 expenses
    expect(screen.getByText('Expense 1')).toBeInTheDocument()
    expect(screen.getByText('Expense 10')).toBeInTheDocument()
    expect(screen.queryByText('Expense 11')).not.toBeInTheDocument()
  })

  it('should limit monthly revenue display to 6 items', () => {
    // Mock with more than 6 months
    const manyMonths = Array.from({ length: 10 }, (_, i) => ({
      year: 2024,
      month: i + 1,
      month_name: `Month ${i + 1}`,
      total_revenue: 1000 + i,
      rental_count: i + 1
    }))

    vi.mocked(require('../../hooks/useAuthenticatedQuery').useAuthenticatedQuery).mockImplementation((queryKey) => {
      if (queryKey[0] === 'expenses') {
        return {
          data: mockExpenses,
          isLoading: false,
          error: null,
        }
      }
      if (queryKey[0] === 'analytics' && queryKey[1] === 'monthly-revenue') {
        return {
          data: manyMonths,
          isLoading: false,
          error: null,
        }
      }
      if (queryKey[0] === 'analytics' && queryKey[1] === 'financial-summary') {
        return {
          data: mockFinancialSummary,
          isLoading: false,
          error: null,
        }
      }
      return {
        data: [],
        isLoading: false,
        error: null,
      }
    })

    render(
      <TestWrapper>
        <FinancesPage />
      </TestWrapper>
    )

    // Should show only first 6 months
    expect(screen.getByText('Month 1 2024')).toBeInTheDocument()
    expect(screen.getByText('Month 6 2024')).toBeInTheDocument()
    expect(screen.queryByText('Month 7 2024')).not.toBeInTheDocument()
  })
})