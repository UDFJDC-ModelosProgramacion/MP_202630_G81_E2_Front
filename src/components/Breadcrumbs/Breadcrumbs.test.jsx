import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Breadcrumbs from './Breadcrumbs'
import { getBreadcrumbItems } from './breadcrumbRoutes'

describe('Breadcrumbs', () => {
  it('shows the current page on the home route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Breadcrumbs />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Ruta de navegación' })).toHaveTextContent(
      'Inicio',
    )
    expect(screen.getByText('Inicio')).toHaveAttribute('aria-current', 'page')
  })

  it('builds navigable parent crumbs for a nested detail page', () => {
    render(
      <MemoryRouter initialEntries={['/pets/42/reviews/7/edit']}>
        <Breadcrumbs />
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation', { name: 'Ruta de navegación' })
    expect(within(navigation).getByRole('link', { name: 'Mascotas' })).toHaveAttribute(
      'href',
      '/pets',
    )
    expect(within(navigation).getByRole('link', { name: 'Mascota #42' })).toHaveAttribute(
      'href',
      '/pets/42',
    )
    expect(within(navigation).getByRole('link', { name: 'Reseñas' })).toHaveAttribute(
      'href',
      '/pets/42/reviews',
    )
    expect(within(navigation).getByText('Editar reseña')).toHaveAttribute('aria-current', 'page')
  })

  it('resolves breadcrumbs for every application route pattern', () => {
    const routePaths = [
      '/login',
      '/profile',
      '/pets/new',
      '/pets/inventory',
      '/pets/1/medical-events',
      '/pets/1/reviews/new',
      '/pets/1/vaccination-record',
      '/vaccination-records/new',
      '/shelters/new',
      '/shelters/1/edit',
      '/shelters/1/events/new',
      '/events/2',
      '/medical-events/new',
      '/medical-events/3/edit',
      '/veterinarians/new',
      '/veterinarians/4/edit',
      '/adopters/new',
      '/adopters/5/edit',
      '/followUps',
      '/adoptions/6/followUps/7/edit',
      '/notifications',
    ]

    routePaths.forEach((pathname) => {
      expect(getBreadcrumbItems(pathname).at(-1)).toMatchObject({ to: null })
    })
  })
})
