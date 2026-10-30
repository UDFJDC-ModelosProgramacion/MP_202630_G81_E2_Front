import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormSection from './FormSection'

describe('FormSection', () => {
  it('is a region named after its title and holds its content', () => {
    render(
      <FormSection title="Información básica" description="Datos principales.">
        <p>Contenido</p>
      </FormSection>,
    )

    const region = screen.getByRole('region', { name: 'Información básica' })
    expect(region).toHaveTextContent('Datos principales.')
    expect(region).toHaveTextContent('Contenido')
  })

  it('does not render a description when there is none', () => {
    render(<FormSection title="Fotografía">Contenido</FormSection>)

    expect(screen.getByRole('region', { name: 'Fotografía' })).not.toHaveTextContent('Datos')
  })
})
