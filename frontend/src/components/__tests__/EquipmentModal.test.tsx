import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EquipmentModal from '../EquipmentModal'
import type { Equipment } from '../../types'

// Mock data
const mockEquipment: Equipment = {
  id: 1,
  name: 'Test Equipment',
  quantity: 5,
  description: 'Test description',
  base_price: 1500,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Mock functions
const mockOnClose = vi.fn()
const mockOnSubmit = vi.fn()

describe('EquipmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <EquipmentModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render create modal when no equipment provided', () => {
    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.getByText('Добавить новое оборудование')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /создать/i })).toBeInTheDocument()
  })

  it('should render edit modal when equipment provided', () => {
    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    expect(screen.getByText('Редактировать оборудование')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /обновить/i })).toBeInTheDocument()
  })

  it('should populate form fields when equipment provided', () => {
    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    expect(screen.getByDisplayValue('Test Equipment')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1500')).toBeInTheDocument()
  })

  it('should call onClose when cancel button clicked', async () => {
    const user = userEvent.setup()

    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    await user.click(screen.getByRole('button', { name: /отмена/i }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()

    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Try to submit without filling name
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(screen.getByText('Необходимо указать название оборудования')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()

    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Fill in the form
    await user.type(screen.getByLabelText(/название оборудования/i), 'New Equipment')
    await user.clear(screen.getByLabelText(/количество/i))
    await user.type(screen.getByLabelText(/количество/i), '3')
    await user.clear(screen.getByLabelText(/цена оборудования/i))
    await user.type(screen.getByLabelText(/цена оборудования/i), '2000')
    await user.type(screen.getByLabelText(/описание/i), 'New description')

    // Submit form
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Equipment',
        quantity: 3,
        base_price: 2000,
        description: 'New description'
      })
    })
  })

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup()

    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Try to submit without name to trigger validation error
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(screen.getByText('Необходимо указать название оборудования')).toBeInTheDocument()
    })

    // Start typing in name field
    await user.type(screen.getByLabelText(/название оборудования/i), 'T')

    await waitFor(() => {
      expect(screen.queryByText('Необходимо указать название оборудования')).not.toBeInTheDocument()
    })
  })

  it('should disable submit button during loading', () => {
    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    )

    expect(screen.getByRole('button', { name: /сохранение.../i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /отмена/i })).toBeDisabled()
  })

  it('should disable submit button when form is invalid', () => {
    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Form is invalid when name is empty
    expect(screen.getByRole('button', { name: /создать/i })).toBeDisabled()
  })

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup()

    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Add name to make form valid
    await user.type(screen.getByLabelText(/название оборудования/i), 'Valid Equipment')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /создать/i })).not.toBeDisabled()
    })
  })

  it('should reset form when modal is closed and reopened', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Fill in some data
    await user.type(screen.getByLabelText(/название оборудования/i), 'Test Equipment')

    // Close modal
    rerender(
      <EquipmentModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Reopen modal
    rerender(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Form should be reset
    expect(screen.getByLabelText(/название оборудования/i)).toHaveValue('')
  })

  it('should have proper form structure and accessibility', () => {
    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    // Check form elements
    expect(screen.getByRole('form')).toBeInTheDocument()
    expect(screen.getByLabelText(/название оборудования/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/количество/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/цена оборудования/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/описание/i)).toBeInTheDocument()

    // Check buttons
    expect(screen.getByRole('button', { name: /отмена/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /создать/i })).toBeInTheDocument()
  })

  it('should handle numeric inputs correctly', async () => {
    const user = userEvent.setup()

    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const quantityInput = screen.getByLabelText(/количество/i)
    const priceInput = screen.getByLabelText(/цена оборудования/i)

    // Test quantity input
    await user.clear(quantityInput)
    await user.type(quantityInput, '10')
    expect(quantityInput).toHaveValue(10)

    // Test price input
    await user.clear(priceInput)
    await user.type(priceInput, '2500')
    expect(priceInput).toHaveValue(2500)
  })

  it('should enforce minimum values for numeric inputs', () => {
    render(
      <EquipmentModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const quantityInput = screen.getByLabelText(/количество/i)
    const priceInput = screen.getByLabelText(/цена оборудования/i)

    expect(quantityInput).toHaveAttribute('min', '1')
    expect(priceInput).toHaveAttribute('min', '0')
  })
})