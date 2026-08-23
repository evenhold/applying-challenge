import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Mini Onboarding')
  })

  it('renders the login link', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /iniciar sesión/i })
    expect(link).toHaveAttribute('href', '/login')
  })
})
