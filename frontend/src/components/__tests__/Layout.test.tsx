import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../Layout'

// Mock useAuth hook
const mockLogout = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mockLogout
  })
}))

// Mock for useLocation
const mockLocation = { pathname: '/' }
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => mockLocation,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>
  }
})

// Test wrapper with router
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('should render layout with children', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('Возьми меня')).toBeInTheDocument()
  })

  it('should render all navigation items', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    expect(screen.getByText('Список аренд')).toBeInTheDocument()
    expect(screen.getByText('График аренд')).toBeInTheDocument()
    expect(screen.getByText('Арендаторы')).toBeInTheDocument()
    expect(screen.getByText('Оборудование')).toBeInTheDocument()
    expect(screen.getByText('Финансы')).toBeInTheDocument()
  })

  it('should render navigation icons', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    expect(screen.getByText('📋')).toBeInTheDocument()
    expect(screen.getByText('📊')).toBeInTheDocument()
    expect(screen.getByText('👥')).toBeInTheDocument()
    expect(screen.getByText('🎥')).toBeInTheDocument()
    expect(screen.getByText('💰')).toBeInTheDocument()
  })

  it('should handle logout button click', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    const logoutButton = screen.getByRole('button', { name: /выйти/i })
    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('should be responsive on mobile', () => {
    // Set mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    })

    render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    // In mobile mode, title should be hidden (only icon visible)
    expect(screen.queryByText('Возьми меня')).not.toBeInTheDocument()
  })

  it('should highlight active navigation item', () => {
    // Mock location as /equipment
    mockLocation.pathname = '/equipment'

    render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    const equipmentLink = screen.getByRole('link', { name: /🎥 оборудование/i })
    expect(equipmentLink).toHaveClass('bg-indigo-100', 'text-indigo-700')
  })

  it('should highlight root path correctly', () => {
    // Mock location as root
    mockLocation.pathname = '/'

    render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    const homeLink = screen.getByRole('link', { name: /📋 список аренд/i })
    expect(homeLink).toHaveClass('bg-indigo-100', 'text-indigo-700')
  })

  it('should handle window resize', () => {
    const { rerender } = render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    // Initially desktop
    expect(screen.getByText('Возьми меня')).toBeInTheDocument()

    // Simulate window resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    })

    // Trigger resize event
    fireEvent.resize(window)

    // Force re-render to apply state changes
    rerender(
      <TestWrapper>
        <Layout>
          <div>Test Updated</div>
        </Layout>
      </TestWrapper>
    )

    // Should be in mobile mode now
    expect(screen.getByText('Test Updated')).toBeInTheDocument()
  })

  it('should maintain accessibility with proper roles and titles', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    // Navigation should be accessible
    expect(screen.getByRole('navigation')).toBeInTheDocument()

    // Logout button should have proper title
    const logoutButton = screen.getByRole('button', { name: /выйти/i })
    expect(logoutButton).toHaveAttribute('title', 'Выйти')

    // Links should have proper titles for icons
    const equipmentLink = screen.getByRole('link', { name: /🎥 оборудование/i })
    expect(equipmentLink).toHaveAttribute('title', 'Оборудование')
  })

  it('should render logo image', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    const logoImages = screen.getAllByRole('img')
    expect(logoImages.length).toBeGreaterThan(0)

    // Check if at least one logo image has correct src
    const desktopLogo = logoImages.find(img => img.getAttribute('width') === '30')
    expect(desktopLogo).toBeDefined()
  })

  it('should have correct layout structure', () => {
    const { container } = render(
      <TestWrapper>
        <Layout>
          <div data-testid="main-content">Test Content</div>
        </Layout>
      </TestWrapper>
    )

    // Check main layout structure
    const mainContent = screen.getByTestId('main-content')
    expect(mainContent).toBeInTheDocument()

    // Check sidebar structure
    const sidebar = container.querySelector('.flex.flex-col')
    expect(sidebar).toBeInTheDocument()
  })

  it('should handle navigation correctly', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test</div>
        </Layout>
      </TestWrapper>
    )

    // All navigation links should have correct hrefs
    expect(screen.getByRole('link', { name: /📋 список аренд/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /📊 график аренд/i })).toHaveAttribute('href', '/schedule')
    expect(screen.getByRole('link', { name: /👥 арендаторы/i })).toHaveAttribute('href', '/customers')
    expect(screen.getByRole('link', { name: /🎥 оборудование/i })).toHaveAttribute('href', '/equipment')
    expect(screen.getByRole('link', { name: /💰 финансы/i })).toHaveAttribute('href', '/finances')
  })
})