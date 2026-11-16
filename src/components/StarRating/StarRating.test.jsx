import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StarRating, { Stars } from './StarRating'

describe('Stars', () => {
    it('describes the rating out of five', () => {
        render(<Stars rating={4} />)

        expect(screen.getByRole('img', { name: '4 de 5' })).toHaveTextContent('★★★★☆')
    })

    it('rounds a decimal rating and accepts a custom description', () => {
        render(<Stars rating={4.5} label="4.5 de 5" />)

        expect(screen.getByRole('img', { name: '4.5 de 5' })).toHaveTextContent('★★★★★')
    })
})

describe('StarRating', () => {
    const renderRating = (props = {}) => {
        const onChange = vi.fn()
        render(<StarRating id="rating" label="Calificación" value={0} onChange={onChange} {...props} />)
        return { onChange }
    }

    it('shows five stars and that nothing is rated yet', () => {
        renderRating()

        expect(screen.getAllByRole('radio')).toHaveLength(5)
        expect(screen.getByText('Sin calificar')).toBeInTheDocument()
        expect(screen.getByRole('radiogroup', { name: /Calificación/ })).toBeInTheDocument()
    })

    it('tells the selected rating', () => {
        renderRating({ value: 4 })

        expect(screen.getByRole('radio', { name: '4 estrellas' })).toBeChecked()
        expect(screen.getByRole('radio', { name: '5 estrellas' })).not.toBeChecked()
        expect(screen.getByText('4 de 5')).toBeInTheDocument()
    })

    it('uses the singular for one star', () => {
        renderRating({ value: 1 })

        expect(screen.getByRole('radio', { name: '1 estrella' })).toBeChecked()
    })

    it('reports the star the user chooses', async () => {
        const user = userEvent.setup()
        const { onChange } = renderRating()

        await user.click(screen.getByRole('radio', { name: '3 estrellas' }))

        expect(onChange).toHaveBeenCalledWith(3)
    })

    it('shows an error and marks the group as invalid', () => {
        renderRating({ error: 'Selecciona una calificación.' })

        expect(screen.getByText('Selecciona una calificación.')).toBeInTheDocument()
        expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
    })

    it('does not mark the group as invalid without an error', () => {
        renderRating()

        expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-invalid')
    })
})