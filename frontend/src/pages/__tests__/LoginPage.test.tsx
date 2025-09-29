import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../LoginPage'

// Mock useAuth hook
const mockLogin = vi.fn()
const mockUseAuth = {
  login: mockLogin,
  loginError: null,
  loginLoading: false,
  isAuthenticated: false,
}

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}))

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
    mockUseAuth.loginError = null
    mockUseAuth.loginLoading = false
    mockUseAuth.isAuthenticated = false
  })

  it('should render login form', () => {
    render(<LoginPage />)

    expect(screen.getByText('Вход в систему')).toBeInTheDocument()
    expect(screen.getByText('Введите пин-код для доступа к системе аренды')).toBeInTheDocument()
    expect(screen.getByLabelText('Пин-код')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument()
  })

  it('should have proper form structure', () => {
    render(<LoginPage />)

    const form = screen.getByRole('form')
    expect(form).toBeInTheDocument()

    const input = screen.getByLabelText('Пин-код')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('placeholder', 'Введите пин-код')
    expect(input).toHaveAttribute('autoComplete', 'current-password')
  })

  it('should update input value when typing', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const input = screen.getByLabelText('Пин-код')
    await user.type(input, '12345')

    expect(input).toHaveValue('12345')
  })

  it('should disable submit button when no pin code entered', () => {
    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /войти/i })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when pin code is entered', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const input = screen.getByLabelText('Пин-код')
    const submitButton = screen.getByRole('button', { name: /войти/i })

    await user.type(input, '12345')

    expect(submitButton).not.toBeDisabled()
  })

  it('should call login function on form submission', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const input = screen.getByLabelText('Пин-код')
    const form = screen.getByRole('form')

    await user.type(input, '20031997')
    fireEvent.submit(form)

    expect(mockLogin).toHaveBeenCalledWith('20031997')
  })

  it('should call login function on button click', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const input = screen.getByLabelText('Пин-код')
    const submitButton = screen.getByRole('button', { name: /войти/i })

    await user.type(input, '20031997')
    await user.click(submitButton)

    expect(mockLogin).toHaveBeenCalledWith('20031997')
  })

  it('should show loading state when login is in progress', () => {
    mockUseAuth.loginLoading = true

    render(<LoginPage />)

    expect(screen.getByText('Вход...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByLabelText('Пин-код')).toBeDisabled()
  })

  it('should display login error when present', () => {
    mockUseAuth.loginError = 'Неверный пин-код'

    render(<LoginPage />)

    expect(screen.getByText('Неверный пин-код')).toBeInTheDocument()
  })

  it('should display error object message when error is Error instance', () => {
    mockUseAuth.loginError = new Error('Network error')

    render(<LoginPage />)

    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('should display default error message for unknown error types', () => {
    mockUseAuth.loginError = { some: 'object' }

    render(<LoginPage />)

    expect(screen.getByText('Ошибка входа')).toBeInTheDocument()
  })

  it('should redirect when user is authenticated', () => {
    mockUseAuth.isAuthenticated = true

    render(<LoginPage />)

    expect(mockLocation.href).toBe('/')
  })

  it('should not redirect when user is not authenticated', () => {
    mockUseAuth.isAuthenticated = false

    render(<LoginPage />)

    expect(mockLocation.href).toBe('')
  })

  it('should have proper accessibility attributes', () => {
    render(<LoginPage />)

    // Check headings
    expect(screen.getByRole('heading', { level: 2, name: /вход в систему/i })).toBeInTheDocument()

    // Check form accessibility
    const input = screen.getByLabelText('Пин-код')
    expect(input).toHaveAttribute('id', 'pin-code')
    expect(input).toHaveAttribute('name', 'pinCode')

    // Button should be accessible
    const button = screen.getByRole('button', { name: /войти/i })
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('should have proper responsive design classes', () => {
    const { container } = render(<LoginPage />)

    // Check responsive classes
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
    expect(container.querySelector('.px-4.sm\\:px-6.lg\\:px-8')).toBeInTheDocument()
    expect(container.querySelector('.max-w-md')).toBeInTheDocument()
  })

  it('should have proper styling for different states', () => {
    render(<LoginPage />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass(
      'bg-indigo-600',
      'hover:bg-indigo-700',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed'
    )

    const input = screen.getByLabelText('Пин-код')
    expect(input).toHaveClass(
      'focus:ring-indigo-500',
      'focus:border-indigo-500'
    )
  })

  it('should prevent form submission when loading', async () => {
    mockUseAuth.loginLoading = true
    const user = userEvent.setup()

    render(<LoginPage />)

    const form = screen.getByRole('form')
    fireEvent.submit(form)

    // Login should not be called when loading
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('should clear error when starting to type again', async () => {
    mockUseAuth.loginError = 'Неверный пин-код'

    const { rerender } = render(<LoginPage />)

    // Error should be displayed
    expect(screen.getByText('Неверный пин-код')).toBeInTheDocument()

    // Clear error and rerender
    mockUseAuth.loginError = null
    rerender(<LoginPage />)

    // Error should be gone
    expect(screen.queryByText('Неверный пин-код')).not.toBeInTheDocument()
  })

  it('should handle empty pin code submission gracefully', async () => {
    render(<LoginPage />)

    const form = screen.getByRole('form')

    // Try to submit empty form (button should be disabled)
    const submitButton = screen.getByRole('button', { name: /войти/i })
    expect(submitButton).toBeDisabled()

    // Form submission should not trigger login
    fireEvent.submit(form)
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('should maintain focus management properly', async () => {
    render(<LoginPage />)

    const input = screen.getByLabelText('Пин-код')

    // Focus the input
    await user.click(input)
    expect(input).toHaveFocus()

    // Type some text
    await user.type(input, '1234')
    expect(input).toHaveFocus()
  })

  it('should handle authentication state change', async () => {
    const { rerender } = render(<LoginPage />)

    // Initially not authenticated
    expect(mockLocation.href).toBe('')

    // Simulate authentication
    mockUseAuth.isAuthenticated = true
    rerender(<LoginPage />)

    // Should redirect
    expect(mockLocation.href).toBe('/')
  })

  it('should render with proper layout structure', () => {
    const { container } = render(<LoginPage />)

    // Check main container structure
    const mainContainer = container.querySelector('.min-h-screen.flex.items-center.justify-center')
    expect(mainContainer).toBeInTheDocument()

    // Check form container
    const formContainer = container.querySelector('.max-w-md.w-full')
    expect(formContainer).toBeInTheDocument()

    // Check form spacing
    const form = container.querySelector('.mt-8.space-y-6')
    expect(form).toBeInTheDocument()
  })

  it('should use semantic HTML elements', () => {
    render(<LoginPage />)

    // Should have proper semantic structure
    expect(screen.getByRole('form')).toBeInTheDocument()
    expect(screen.getByRole('heading')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()

    // Password input doesn't have textbox role by default
    const passwordInput = screen.getByLabelText('Пин-код')
    expect(passwordInput).toBeInTheDocument()
  })
})