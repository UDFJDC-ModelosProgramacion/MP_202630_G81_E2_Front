import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMessage,
  deleteMessage,
  getAllMessages,
  updateMessage,
} from '../../services/messageService'
import { getAllUsers } from '../../services/userService'
import MessagesPage from './MessagesPage'

vi.mock('../../services/messageService', () => ({
  getAllMessages: vi.fn(),
  createMessage: vi.fn(),
  updateMessage: vi.fn(),
  deleteMessage: vi.fn(),
}))

vi.mock('../../services/userService', () => ({
  getAllUsers: vi.fn(),
}))

vi.mock('../../auth/useAuth', () => ({
  default: () => ({
    session: { userId: 1, name: 'Anggel' },
  }),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <MessagesPage />
    </MemoryRouter>,
  )
}

describe('MessagesPage (HU77 to HU80)', () => {
  const mockMessages = [
    {
      id: 10,
      content: 'Hola Anggel, sobre la adopción',
      sendUser: { id: 2, firstName: 'Luna', email: 'luna@test.com' },
      receivesUser: { id: 1, firstName: 'Anggel' },
      isRead: false,
      sendDate: '2026-11-10T10:00:00Z',
    },
  ]

  const mockUsers = [
    { id: 1, firstName: 'Anggel', email: 'anggel@test.com' },
    { id: 2, firstName: 'Luna', email: 'luna@test.com' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    getAllMessages.mockResolvedValue(mockMessages)
    getAllUsers.mockResolvedValue(mockUsers)
  })

  it('renders conversations and unread badges (HU78)', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Luna')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // unread badge
    })
  })

  it('opens conversation thread and marks messages as read (HU79)', async () => {
    const user = userEvent.setup()
    updateMessage.mockResolvedValueOnce({ id: 10, isRead: true })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Luna')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Luna'))

    await waitFor(() => {
      expect(screen.getByText('Chat con Luna')).toBeInTheDocument()
      expect(screen.getByText('Hola Anggel, sobre la adopción')).toBeInTheDocument()
      expect(updateMessage).toHaveBeenCalledWith(10, { isRead: true }, 1)
    })
  })

  it('sends reply message in active conversation (HU77)', async () => {
    const user = userEvent.setup()
    updateMessage.mockResolvedValueOnce({ id: 10, isRead: true })
    createMessage.mockResolvedValueOnce({
      id: 11,
      content: 'Claro que sí, cuéntame',
      sendUser: { id: 1 },
      receivesUser: { id: 2 },
      isRead: false,
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Luna')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Luna'))

    const input = screen.getByLabelText('Escribir mensaje')
    await user.type(input, 'Claro que sí, cuéntame')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(createMessage).toHaveBeenCalledWith(
        {
          sendUser: { id: 1 },
          receivesUser: { id: 2 },
          content: 'Claro que sí, cuéntame',
          isRead: false,
        },
        1,
      )
    })
  })

  it('deletes message from conversation (HU80)', async () => {
    const user = userEvent.setup()
    updateMessage.mockResolvedValueOnce({ id: 10, isRead: true })
    deleteMessage.mockResolvedValueOnce(null)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Luna')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Luna'))

    const deleteBtn = screen.getByRole('button', { name: 'Eliminar' })
    await user.click(deleteBtn)

    expect(screen.getByText('¿Eliminar mensaje?')).toBeInTheDocument()
    const confirmDeleteBtn = screen.getAllByRole('button', { name: 'Eliminar' })[1]
    await user.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(deleteMessage).toHaveBeenCalledWith(10, 1)
    })
  })
})
