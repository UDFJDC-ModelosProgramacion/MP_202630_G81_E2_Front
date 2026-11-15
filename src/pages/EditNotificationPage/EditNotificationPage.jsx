import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import NotificationForm from '../../components/NotificationForm/NotificationForm'
import { initialValues } from '../../components/NotificationForm/notificationFields'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession } from '../../config/session'
import {
    deleteNotification,
    getNotification,
    updateNotification,
} from '../../services/notificationService'
import { isSent, statusLabel } from '../../utils/notifications'
import styles from './EditNotificationPage.module.css'

function EditNotificationForm({ userId, notification }) {
    const navigate = useNavigate()
    
    const sent = isSent(notification)

    async function update(changes) {
        await updateNotification(userId, notification.id, changes)
        navigate('/notifications', { state: { updated: true } })
    }

    async function remove() {
        await deleteNotification(userId, notification.id)
        navigate('/notifications', { state: { deleted: true } })
    }

    return (
        <>
            <p className={styles.status}>Estado: {statusLabel(notification)}</p>
            <NotificationForm
                defaultValues={initialValues(notification)}
                ariaLabel="Edición de notificación"
                submitLabel="Actualizar"
                notice="Una notificación ya enviada no puede eliminarse ni cambiar de canal."
                channelLocked={sent}
                canDelete={!sent}
                onSubmit={update}
                onDelete={remove}
            />
        </>
    )
}

function EditNotificationLoader({ userId, notificationId }) {
    const [result, setResult] = useState({ status: 'loading', notification: null, message: '' })

    useEffect(() => {
        let cancelled = false
        getNotification(userId, notificationId)
            .then((notification) => {
                if (!cancelled) setResult({ status: 'ready', notification, message: '' })
            })
            .catch((error) => {
                if (!cancelled) setResult({ status: 'error', notification: null, message: error.message })
            })
        return () => {
            cancelled = true
        }
    }, [userId, notificationId])

    const { status, notification, message } = result
    if (status === 'loading') return <ScreenState state="loading" />
    if (status === 'error') return <ScreenState state="error" message={message} />
    return <EditNotificationForm userId={userId} notification={notification} />
}

export default function EditNotificationPage() {
    const { notificationId } = useParams()
    const { userId } = getSession()

    return (
        <section className={styles.page}>
            <Link to="/notifications">Volver a notificaciones</Link>
            <h1 className={styles.title}>Editar notificación</h1>
            <EditNotificationLoader key={notificationId} userId={userId} notificationId={notificationId} />
        </section>
    )
}