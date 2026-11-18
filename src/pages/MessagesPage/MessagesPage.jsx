import { useEffect, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import ModalDialog from '../../components/ModalDialog/ModalDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import useAuth from '../../auth/useAuth'
import {
  createMessage,
  deleteMessage,
  getAllMessages,
  updateMessage,
} from '../../services/messageService'
import { getAllUsers } from '../../services/userService'
import { groupMessagesByConversation, validateMessageContent } from './messageForm'
import styles from './MessagesPage.module.css'

export default function MessagesPage() {
  const { session } = useAuth()
  const currentUserId = session?.userId || 1

  const [messages, setMessages] = useState([])
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activePartnerId, setActivePartnerId] = useState(null)
  const [replyText, setReplyText] = useState('')

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newRecipientId, setNewRecipientId] = useState('')
  const [newMessageText, setNewMessageText] = useState('')
  const [newFormError, setNewFormError] = useState('')

  const [msgToDelete, setMsgToDelete] = useState(null)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([getAllMessages(currentUserId), getAllUsers('ADMIN')])
      .then(([msgs, users]) => {
        if (!active) return
        setMessages(msgs || [])
        setUsersList(users || [])
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err?.message || 'Error al cargar mensajes')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [currentUserId])

  const conversations = groupMessagesByConversation(messages, currentUserId)
  const activeConversation = conversations.find((c) => c.partnerId === activePartnerId)

  // Mark unread messages as read when opening conversation (HU79)
  function handleSelectConversation(conv) {
    setActivePartnerId(conv.partnerId)
    const unreadReceived = conv.messages.filter(
      (m) => m.sendUser?.id !== currentUserId && !m.isRead,
    )
    unreadReceived.forEach((m) => {
      updateMessage(m.id, { isRead: true }, currentUserId)
        .then(() => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === m.id ? { ...msg, isRead: true } : msg)),
          )
        })
        .catch(() => {})
    })
  }

  // Send reply within open conversation (HU77)
  async function handleSendReply(e) {
    e.preventDefault()
    if (!replyText.trim() || !activePartnerId) return

    const errors = validateMessageContent(replyText, currentUserId, activePartnerId)
    if (Object.keys(errors).length > 0) {
      setActionError(errors.content || errors.recipientId)
      return
    }

    try {
      const payload = {
        sendUser: { id: currentUserId },
        receivesUser: { id: activePartnerId },
        content: replyText.trim(),
        isRead: false,
      }
      const created = await createMessage(payload, currentUserId)
      setMessages((prev) => [...prev, created])
      setReplyText('')
    } catch (err) {
      setActionError(err?.message || 'Error al enviar el mensaje')
    }
  }

  // Create new message thread from modal (HU77)
  async function handleCreateNewMessage(e) {
    e.preventDefault()
    const errors = validateMessageContent(newMessageText, currentUserId, newRecipientId)
    if (Object.keys(errors).length > 0) {
      setNewFormError(errors.content || errors.recipientId)
      return
    }

    try {
      const payload = {
        sendUser: { id: currentUserId },
        receivesUser: { id: Number(newRecipientId) },
        content: newMessageText.trim(),
        isRead: false,
      }
      const created = await createMessage(payload, currentUserId)
      setMessages((prev) => [...prev, created])
      setActivePartnerId(Number(newRecipientId))
      setIsNewModalOpen(false)
      setNewRecipientId('')
      setNewMessageText('')
      setNewFormError('')
    } catch (err) {
      setNewFormError(err?.message || 'Error al enviar el mensaje')
    }
  }

  // Delete message (HU80)
  async function handleConfirmDelete() {
    if (!msgToDelete) return
    try {
      await deleteMessage(msgToDelete.id, currentUserId)
      setMessages((prev) => prev.filter((m) => m.id !== msgToDelete.id))
      setMsgToDelete(null)
    } catch (err) {
      setActionError(err?.message || 'Error al eliminar el mensaje')
      setMsgToDelete(null)
    }
  }

  if (loading) return <ScreenState state="loading" />
  if (error) return <ScreenState state="error" message={error} />

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.mark} aria-hidden="true">
            ✉
          </span>
          <div>
            <h1 className={styles.title}>Mensajes y Conversaciones</h1>
            <p className={styles.subtitle}>
              Bandeja de entrada y comunicación directa con otros usuarios.
            </p>
          </div>
        </div>
        <button
          type="button"
          className={styles.newMessageBtn}
          onClick={() => setIsNewModalOpen(true)}
        >
          Nuevo Mensaje
        </button>
      </header>

      <div className={styles.chatLayout}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Conversaciones</h2>
          {conversations.length === 0 ? (
            <div className={styles.placeholderChat}>
              <p>No tienes conversaciones activas.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.partnerId}
                className={`${styles.conversationItem} ${
                  activePartnerId === conv.partnerId ? styles.activeConversation : ''
                }`}
                onClick={() => handleSelectConversation(conv)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.partnerInfo}>
                  <span className={styles.partnerName}>{conv.partnerName}</span>
                  {conv.partnerEmail && (
                    <span className={styles.partnerEmail}>{conv.partnerEmail}</span>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                )}
              </div>
            ))
          )}
        </aside>

        <main className={styles.chatArea}>
          {activeConversation ? (
            <>
              <div className={styles.chatHeader}>
                <span className={styles.partnerName}>
                  Chat con {activeConversation.partnerName}
                </span>
              </div>

              <div className={styles.messagesList}>
                {activeConversation.messages.map((m) => {
                  const isMine = m.sendUser?.id === currentUserId
                  return (
                    <div
                      key={m.id}
                      className={`${styles.messageRow} ${
                        isMine ? styles.sentMessage : styles.receivedMessage
                      }`}
                    >
                      <div className={styles.bubble}>{m.content}</div>
                      <div className={styles.meta}>
                        <span>{isMine ? (m.isRead ? 'Leído' : 'Enviado') : ''}</span>
                        <button
                          type="button"
                          className={styles.deleteMsgBtn}
                          onClick={() => setMsgToDelete(m)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <form className={styles.inputBar} onSubmit={handleSendReply}>
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  aria-label="Escribir mensaje"
                />
                <button type="submit" className={styles.sendBtn}>
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className={styles.placeholderChat}>
              <p>Selecciona una conversación o inicia un nuevo mensaje para comenzar.</p>
            </div>
          )}
        </main>
      </div>

      {isNewModalOpen && (
        <ModalDialog onClose={() => setIsNewModalOpen(false)}>
          <h2 style={{ margin: '0 0 1rem' }}>Iniciar Nueva Conversación</h2>
          <form onSubmit={handleCreateNewMessage} className={styles.modalForm}>
            {newFormError && <p style={{ color: 'red' }}>{newFormError}</p>}
            <div>
              <label htmlFor="recipientSelect">Destinatario:</label>
              <select
                id="recipientSelect"
                value={newRecipientId}
                onChange={(e) => setNewRecipientId(e.target.value)}
                required
              >
                <option value="">Selecciona un usuario...</option>
                {usersList
                  .filter((u) => u.id !== currentUserId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {`${u.firstName || ''} ${u.lastName || ''}`} ({u.email})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="modalContent">Mensaje:</label>
              <textarea
                id="modalContent"
                placeholder="Escribe tu mensaje aquí..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                style={{ padding: '0.5rem 1rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.sendBtn}
                style={{ padding: '0.5rem 1rem' }}
              >
                Enviar Mensaje
              </button>
            </div>
          </form>
        </ModalDialog>
      )}

      {msgToDelete && (
        <ConfirmDialog
          title="¿Eliminar mensaje?"
          message="¿Deseas eliminar este mensaje de tu conversación?"
          confirmLabel="Eliminar"
          onConfirm={handleConfirmDelete}
          onCancel={() => setMsgToDelete(null)}
        />
      )}

      {actionError && (
        <ErrorDialog
          title="Error en mensajería"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}
    </section>
  )
}
