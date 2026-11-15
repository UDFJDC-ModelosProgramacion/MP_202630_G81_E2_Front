import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TextField } from '../../components/FormField/FormField'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession } from '../../config/session'
import { getNotifications } from '../../services/notificationService'
import {
    channelLabel,
    formatShortDate,
    formatTime,
    isSent,
    sortNotifications,
    statusLabel,
} from '../../utils/notifications'
import { hasFilters, NO_FILTERS, validateRange } from './notificationFilters'
import styles from './NotificationsPage.module.css'

const BANNERS = {
    scheduled: 'La notificación se programó correctamente.',
    updated: 'La notificación se actualizó correctamente.',
    deleted: 'La notificación se eliminó correctamente.',
}

const bannerOf = (state) => {
    const key = Object.keys(BANNERS).find((name) => state?.[name])
    return key ? BANNERS[key] : null
}

export default function NotificationsPage() {
    const { userId } = getSession()
    const { state } = useLocation()
    const [filters, setFilters] = useState(NO_FILTERS)
    const [applied, setApplied] = useState(NO_FILTERS)
    const [rangeError, setRangeError] = useState('')

    const [result, setResult] = useState({ key: null, items: [], message: '' })
    const requestKey = `${userId}|${applied.startDate}|${applied.endDate}`

    useEffect(() => {
        let cancelled = false
        getNotifications(userId, applied)
            .then((items) => {
                if (!cancelled) setResult({ key: requestKey, items: sortNotifications(items), message: '' })
            })
            .catch((error) => {
                if (!cancelled) setResult({ key: requestKey, items: null, message: error.message })
            })
        return () => {
            cancelled = true
        }
    }, [userId, applied, requestKey])

    function handleChange(event) {
        const { name, value } = event.target
        setFilters((current) => ({ ...current, [name]: value }))
        setRangeError('')
    }

    function handleFilter(event) {
        event.preventDefault()
        const error = validateRange(filters)
        setRangeError(error)
        if (error) {
            document.getElementById('endDate')?.focus()
            return
        }
        setApplied(filters)
    }

    const banner = bannerOf(state)
    const { items, message } = result
    let content
    if (result.key !== requestKey) content = <ScreenState state="loading" />
    else if (items === null) content = <ScreenState state="error" message={message} />
    else if (items.length === 0) {
        content = (
            <ScreenState
                state="empty"
                message={
                    hasFilters(applied)
                        ? 'No se encontraron notificaciones en el rango de fechas seleccionado.'
                        : 'Aún no tienes notificaciones.'
                }
            />
        )
    } else {
        content = (
            <ul className={styles.list}>
                {items.map((notification) => (
                    <li key={notification.id} className={styles.card}>
                        <div className={styles.row}>
                            <h2 className={styles.name}>{notification.message}</h2>
                            <div className={styles.chips}>
                                <span className={styles.chip}>{channelLabel(notification)}</span>
                                <span
                                    className={
                                        isSent(notification) ? `${styles.chip} ${styles.sent}` : styles.chip
                                    }
                                >
                                    {statusLabel(notification)}
                                </span>
                            </div>
                        </div>
                        <div className={styles.row}>
                            <p className={styles.when}>
                                {formatShortDate(notification.date)} · {formatTime(notification.time)}
                            </p>
                            <Link
                                to={`/notifications/${notification.id}/edit`}
                                aria-label={`Ver detalle de ${notification.message}`}
                            >
                                Ver detalle
                            </Link>
                        </div>
                    </li>
                ))}
            </ul>
        )
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Mis notificaciones</h1>
                <Link to="/notifications/new">Programar notificación</Link>
            </header>

            {banner && (
                <p role="status" className={styles.success}>
                    {banner}
                </p>
            )}

            <form className={styles.filters} noValidate onSubmit={handleFilter} aria-label="Filtros">
                <TextField
                    id="startDate"
                    name="startDate"
                    label="Desde"
                    type="date"
                    value={filters.startDate}
                    onChange={handleChange}
                />
                <TextField
                    id="endDate"
                    name="endDate"
                    label="Hasta"
                    type="date"
                    value={filters.endDate}
                    error={rangeError}
                    onChange={handleChange}
                />
                <button type="submit" className={styles.submit}>
                    Filtrar
                </button>
            </form>

            {content}
        </section>
    )
}