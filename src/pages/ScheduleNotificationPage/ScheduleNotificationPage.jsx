import { Link, useNavigate } from 'react-router-dom'
import NotificationForm from '../../components/NotificationForm/NotificationForm'
import { getSession } from '../../config/session'
import { createNotification } from '../../services/notificationService'
import styles from './ScheduleNotificationPage.module.css'

export default function ScheduleNotificationPage() {
    const navigate = useNavigate()
    const { userId } = getSession()

    async function schedule(notification) {
        await createNotification(userId, notification)
        navigate('/notifications', { state: { scheduled: true } })
    }

    return (
        <section className={styles.page}>
            <Link to="/notifications">Volver a notificaciones</Link>
            <h1 className={styles.title}>Programar notificación</h1>
            <NotificationForm
                ariaLabel="Programación de notificación"
                submitLabel="Programar"
                notice="Canales disponibles: correo (EMAIL), SMS o notificación push (PUSH)."
                onSubmit={schedule}
            />
        </section>
    )
}