import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SelectField, TextField } from './FormField'

describe('TextField', () => {
  it('links the label to the input and marks it as required', () => {
    render(<TextField id="name" label="Nombre" required value="" onChange={() => {}} />)

    const input = screen.getByRole('textbox', { name: 'Nombre' })
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('shows the error and ties it to the input', () => {
    render(
      <TextField id="name" label="Nombre" error="Este campo es obligatorio." value="" onChange={() => {}} />,
    )

    const input = screen.getByRole('textbox', { name: 'Nombre' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Este campo es obligatorio.')
  })
})

describe('SelectField', () => {
  it('offers a placeholder followed by the options', () => {
    render(
      <SelectField
        id="species"
        label="Especie"
        options={['Perro', { value: 'true', label: 'Sí' }]}
        value=""
        onChange={() => {}}
      />,
    )

    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['Seleccione', 'Perro', 'Sí'])
    expect(screen.getByRole('option', { name: 'Sí' })).toHaveValue('true')
  })
})
