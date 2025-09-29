import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EquipmentPage from '../EquipmentPage'
import type { Equipment } from '../../types'

// Mock data
const mockEquipment: Equipment[] = [
  {
    id: 1,
    name: 'GoPro 13',
    quantity: 3,
    description: 'Action camera',
    base_price: 1500,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'DJI Osmo Pocket 3',
    quantity: 0,
    description: 'Handheld camera',
    base_price: 2000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

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
  useAuthenticatedQuery: vi.fn(() => ({
    data: mockEquipment,
    isLoading: false,
    error: null,
  })),
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

describe('EquipmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  it('should render page title and add button', () => {
    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    expect(screen.getByText('Управление оборудованием')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /добавить оборудование/i })).toBeInTheDocument()
  })

  it('should display statistics cards', () => {
    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    // Should show total types
    expect(screen.getByText('2')).toBeInTheDocument() // 2 types of equipment
    expect(screen.getByText('Типов оборудования')).toBeInTheDocument()

    // Should show total items
    expect(screen.getByText('3')).toBeInTheDocument() // 3 + 0 = 3 total items
    expect(screen.getByText('Единиц оборудования')).toBeInTheDocument()

    // Should show total value
    expect(screen.getByText('4\u00A0500₽')).toBeInTheDocument() // (1500*3) + (2000*0) = 4500
    expect(screen.getByText('Общая стоимость')).toBeInTheDocument()
  })

  it('should display equipment list', () => {
    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    expect(screen.getByText('GoPro 13')).toBeInTheDocument()
    expect(screen.getByText('DJI Osmo Pocket 3')).toBeInTheDocument()
    expect(screen.getByText('Action camera')).toBeInTheDocument()
    expect(screen.getByText('Handheld camera')).toBeInTheDocument()
  })

  it('should show correct quantity badges with colors', () => {
    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    // GoPro should have yellow badge (quantity > 0 but <= 5)
    const goProBadge = screen.getByText('3 шт.')
    expect(goProBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')

    // DJI should have red badge (quantity = 0)
    const djiBadge = screen.getByText('0 шт.')
    expect(djiBadge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('should display prices correctly', () => {
    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    expect(screen.getByText('Цена: 1500₽')).toBeInTheDocument()
    expect(screen.getByText('Цена: 2000₽')).toBeInTheDocument()
    expect(screen.getByText('Общая стоимость: 4\u00A0500₽')).toBeInTheDocument()
    expect(screen.getByText('Общая стоимость: 0₽')).toBeInTheDocument()
  })

  it('should open modal when add button clicked', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /добавить оборудование/i }))

    await waitFor(() => {
      expect(screen.getByText('Добавить новое оборудование')).toBeInTheDocument()
    })
  })

  it('should open edit modal when edit button clicked', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    const editButtons = screen.getAllByText('Изменить')
    await user.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Редактировать оборудование')).toBeInTheDocument()
    })
  })

  it('should handle delete confirmation', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    const deleteButtons = screen.getAllByText('Удалить')
    await user.click(deleteButtons[0])

    expect(mockConfirm).toHaveBeenCalledWith('Вы уверены, что хотите удалить это оборудование?')
    expect(mockMutate).toHaveBeenCalledWith(1) // Delete equipment with id 1
  })

  it('should not delete when user cancels confirmation', async () => {
    mockConfirm.mockReturnValue(false)
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    const deleteButtons = screen.getAllByText('Удалить')
    await user.click(deleteButtons[0])

    expect(mockConfirm).toHaveBeenCalled()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('should show empty state when no equipment', () => {
    // Mock empty equipment array
    vi.mocked(require('../../hooks/useAuthenticatedQuery').useAuthenticatedQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    expect(screen.getByText('🎥')).toBeInTheDocument()
    expect(screen.getByText('Нет оборудования')).toBeInTheDocument()
    expect(screen.getByText('Добавьте первое оборудование для начала работы')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    // Mock loading state
    vi.mocked(require('../../hooks/useAuthenticatedQuery').useAuthenticatedQuery).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    })

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should handle form submission for creating equipment', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    // Open modal
    await user.click(screen.getByRole('button', { name: /добавить оборудование/i }))

    // Fill form
    await user.type(screen.getByLabelText(/название оборудования/i), 'New Equipment')
    await user.clear(screen.getByLabelText(/количество/i))
    await user.type(screen.getByLabelText(/количество/i), '5')
    await user.clear(screen.getByLabelText(/цена оборудования/i))
    await user.type(screen.getByLabelText(/цена оборудования/i), '3000')
    await user.type(screen.getByLabelText(/описание/i), 'New description')

    // Submit
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        name: 'New Equipment',
        quantity: 5,
        base_price: 3000,
        description: 'New description'
      })
    })
  })

  it('should handle form submission for updating equipment', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    // Open edit modal
    const editButtons = screen.getAllByText('Изменить')
    await user.click(editButtons[0])

    // Update name
    const nameInput = screen.getByDisplayValue('GoPro 13')
    await user.clear(nameInput)
    await user.type(nameInput, 'GoPro 13 Updated')

    // Submit
    await user.click(screen.getByRole('button', { name: /обновить/i }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        id: 1,
        data: {
          name: 'GoPro 13 Updated',
          quantity: 3,
          base_price: 1500,
          description: 'Action camera'
        }
      })
    })
  })

  it('should close modal after successful operation', async () => {
    const user = userEvent.setup()

    // Mock successful mutation
    vi.mocked(mockMutate).mockImplementation((_data, { onSuccess }) => {
      if (onSuccess) onSuccess()
    })

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    // Open modal
    await user.click(screen.getByRole('button', { name: /добавить оборудование/i }))

    expect(screen.getByText('Добавить новое оборудование')).toBeInTheDocument()

    // Fill and submit form
    await user.type(screen.getByLabelText(/название оборудования/i), 'Test Equipment')
    await user.click(screen.getByRole('button', { name: /создать/i }))

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Добавить новое оборудование')).not.toBeInTheDocument()
    })
  })

  it('should invalidate queries after successful operations', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    // Test delete
    const deleteButtons = screen.getAllByText('Удалить')
    await user.click(deleteButtons[0])

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['equipment'] })
  })

  it('should have proper responsive design classes', () => {
    const { container } = render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    // Check responsive spacing
    expect(container.querySelector('.space-y-4.sm\\:space-y-6')).toBeInTheDocument()

    // Check responsive grid
    expect(container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <EquipmentPage />
      </TestWrapper>
    )

    // Main heading
    expect(screen.getByRole('heading', { level: 1, name: /управление оборудованием/i })).toBeInTheDocument()

    // Buttons should be focusable
    const addButton = screen.getByRole('button', { name: /добавить оборудование/i })
    expect(addButton).toHaveAttribute('type', 'button')

    // Edit and delete buttons
    const editButtons = screen.getAllByRole('button', { name: /изменить/i })
    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })

    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
  })
})