import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RentalModal from '../RentalModal'
import type { Rental, Equipment } from '../../types'

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
    quantity: 2,
    description: 'Handheld camera',
    base_price: 2000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockRental: Rental = {
  id: 1,
  equipment_id: 1,
  equipment_name: 'GoPro 13',
  start_date: '2024-01-15T10:00',
  end_date: '2024-01-16T18:00',
  customer_name: 'Иван Петров',
  customer_phone: '79123456789',
  needs_delivery: true,
  delivery_address: 'Москва, ул. Ленина, 1',
  rental_price: 1500,
  delivery_price: 500,
  delivery_costs: 200,
  status: 'pending',
  total_price: 2000,
  profit: 1300,
  source: 'авито',
  comment: 'Тестовый комментарий',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Mock functions
const mockOnClose = vi.fn()
const mockOnSubmit = vi.fn()

describe('RentalModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <RentalModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render create modal when no rental provided', () => {
    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    expect(screen.getByText('Добавить новую аренду')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /создать/i })).toBeInTheDocument()
  })

  it('should render edit modal when rental provided', () => {
    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
        rental={mockRental}
      />
    )

    expect(screen.getByText('Редактировать аренду')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /обновить/i })).toBeInTheDocument()
  })

  it('should populate form fields when rental provided', () => {
    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
        rental={mockRental}
      />
    )

    expect(screen.getByDisplayValue('Иван Петров')).toBeInTheDocument()
    expect(screen.getByDisplayValue('79123456789')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-15T10:00')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-16T18:00')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1500')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Москва, ул. Ленина, 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Тестовый комментарий')).toBeInTheDocument()
  })

  it('should call onClose when cancel button clicked', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    await user.click(screen.getByRole('button', { name: /отмена/i }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(screen.getByText('Необходимо выбрать оборудование')).toBeInTheDocument()
      expect(screen.getByText('Необходимо указать дату начала')).toBeInTheDocument()
      expect(screen.getByText('Необходимо указать дату окончания')).toBeInTheDocument()
      expect(screen.getByText('Необходимо указать ФИО арендатора')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate phone number format', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    const phoneInput = screen.getByLabelText(/телефон/i)

    // Test invalid phone (too short)
    await user.type(phoneInput, '123456')
    await user.tab() // Trigger validation

    await waitFor(() => {
      expect(screen.getByText('Номер телефона должен содержать 11 цифр')).toBeInTheDocument()
    })

    // Test valid phone
    await user.clear(phoneInput)
    await user.type(phoneInput, '79123456789')

    await waitFor(() => {
      expect(screen.queryByText('Номер телефона должен содержать 11 цифр')).not.toBeInTheDocument()
    })
  })

  it('should validate date range', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    const startDateInput = screen.getByLabelText(/дата начала/i)
    const endDateInput = screen.getByLabelText(/дата окончания/i)

    // Set end date before start date
    await user.type(startDateInput, '2024-01-16T10:00')
    await user.type(endDateInput, '2024-01-15T10:00')

    await waitFor(() => {
      expect(screen.getByText('Дата окончания должна быть позже даты начала')).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Fill equipment
    const equipmentSelect = screen.getByRole('combobox', { name: /оборудование/i })
    fireEvent.change(equipmentSelect, { target: { value: '1' } })

    // Fill dates
    await user.type(screen.getByLabelText(/дата начала/i), '2024-01-15T10:00')
    await user.type(screen.getByLabelText(/дата окончания/i), '2024-01-16T18:00')

    // Fill customer info
    await user.type(screen.getByLabelText(/фио арендатора/i), 'Иван Петров')
    await user.type(screen.getByLabelText(/телефон/i), '79123456789')

    // Fill price
    await user.clear(screen.getByLabelText(/цена аренды/i))
    await user.type(screen.getByLabelText(/цена аренды/i), '1500')

    // Submit form
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        equipment_id: 1,
        start_date: '2024-01-15T10:00',
        end_date: '2024-01-16T18:00',
        customer_name: 'Иван Петров',
        customer_phone: '79123456789',
        needs_delivery: false,
        delivery_address: '',
        rental_price: 1500,
        delivery_price: 0,
        delivery_costs: 0,
        source: 'авито',
        comment: ''
      })
    })
  })

  it('should handle delivery option correctly', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Check delivery checkbox
    const deliveryCheckbox = screen.getByLabelText(/нужна доставка/i)
    await user.click(deliveryCheckbox)

    // Delivery fields should appear
    expect(screen.getByLabelText(/адрес доставки/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/цена доставки/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/расходы на доставку/i)).toBeInTheDocument()

    // Fill delivery info
    await user.type(screen.getByLabelText(/адрес доставки/i), 'Москва, ул. Ленина, 1')
    await user.clear(screen.getByLabelText(/цена доставки/i))
    await user.type(screen.getByLabelText(/цена доставки/i), '500')
    await user.clear(screen.getByLabelText(/расходы на доставку/i))
    await user.type(screen.getByLabelText(/расходы на доставку/i), '200')

    expect(screen.getByDisplayValue('Москва, ул. Ленина, 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('500')).toBeInTheDocument()
    expect(screen.getByDisplayValue('200')).toBeInTheDocument()
  })

  it('should handle source selection', async () => {
    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Check if all sources are available
    expect(screen.getByText('Авито')).toBeInTheDocument()
    expect(screen.getByText('Сайт')).toBeInTheDocument()
    expect(screen.getByText('Рекомендация')).toBeInTheDocument()
    expect(screen.getByText('Карты')).toBeInTheDocument()
  })

  it('should disable submit button when form is invalid', () => {
    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Form is invalid when required fields are empty
    expect(screen.getByRole('button', { name: /создать/i })).toBeDisabled()
  })

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Fill all required fields
    const equipmentSelect = screen.getByRole('combobox', { name: /оборудование/i })
    fireEvent.change(equipmentSelect, { target: { value: '1' } })

    await user.type(screen.getByLabelText(/дата начала/i), '2024-01-15T10:00')
    await user.type(screen.getByLabelText(/дата окончания/i), '2024-01-16T18:00')
    await user.type(screen.getByLabelText(/фио арендатора/i), 'Иван Петров')
    await user.type(screen.getByLabelText(/телефон/i), '79123456789')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /создать/i })).not.toBeDisabled()
    })
  })

  it('should disable buttons during loading', () => {
    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
        isLoading={true}
      />
    )

    expect(screen.getByRole('button', { name: /сохранение.../i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /отмена/i })).toBeDisabled()
  })

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Try to submit to trigger validation errors
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(screen.getByText('Необходимо указать ФИО арендатора')).toBeInTheDocument()
    })

    // Start typing in name field
    await user.type(screen.getByLabelText(/фио арендатора/i), 'И')

    await waitFor(() => {
      expect(screen.queryByText('Необходимо указать ФИО арендатора')).not.toBeInTheDocument()
    })
  })

  it('should reset form when modal is closed and reopened', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Fill in some data
    await user.type(screen.getByLabelText(/фио арендатора/i), 'Test Customer')

    // Close modal
    rerender(
      <RentalModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Reopen modal
    rerender(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Form should be reset
    expect(screen.getByLabelText(/фио арендатора/i)).toHaveValue('')
  })

  it('should have proper form structure and accessibility', () => {
    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Check form elements
    expect(screen.getByRole('form')).toBeInTheDocument()
    expect(screen.getByLabelText(/оборудование/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/дата начала/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/дата окончания/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/фио арендатора/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/телефон/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/цена аренды/i)).toBeInTheDocument()

    // Check buttons
    expect(screen.getByRole('button', { name: /отмена/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /создать/i })).toBeInTheDocument()
  })

  it('should handle numeric inputs correctly', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    const priceInput = screen.getByLabelText(/цена аренды/i)

    // Test price input
    await user.clear(priceInput)
    await user.type(priceInput, '1500')
    expect(priceInput).toHaveValue(1500)
  })

  it('should enforce minimum values for numeric inputs', () => {
    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    const priceInput = screen.getByLabelText(/цена аренды/i)
    expect(priceInput).toHaveAttribute('min', '0')
    expect(priceInput).toHaveAttribute('step', '10')
  })

  it('should handle phone input correctly (only digits)', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    const phoneInput = screen.getByLabelText(/телефон/i)

    // Try to enter non-digits
    await user.type(phoneInput, 'abc123def456')

    // Should only contain digits
    expect(phoneInput).toHaveValue('123456')
  })

  it('should limit phone input to 11 digits', async () => {
    const user = userEvent.setup()

    render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    const phoneInput = screen.getByLabelText(/телефон/i)

    // Try to enter more than 11 digits
    await user.type(phoneInput, '123456789012345')

    // Should be limited to 11 digits
    expect(phoneInput).toHaveValue('12345678901')
  })

  it('should have responsive mobile design', () => {
    const { container } = render(
      <RentalModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        equipment={mockEquipment}
      />
    )

    // Check responsive classes
    const modalContainer = container.querySelector('.w-full.h-full.sm\\:w-full.sm\\:max-w-2xl')
    expect(modalContainer).toBeInTheDocument()

    // Check sticky bottom buttons
    const buttonContainer = container.querySelector('.sticky.bottom-0')
    expect(buttonContainer).toBeInTheDocument()
  })
})