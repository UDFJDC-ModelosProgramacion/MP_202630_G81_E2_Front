import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getVeterinarian } from '../../services/veterinarianService'
import { formatDay } from '../../utils/dates'
import styles from './VeterinarianProfilePage.module.css'

export default function VeterinarianProfilePage() {
  const { veterinarianId } = useParams()
  const [result, setResult] = useState({ status: 'loading', veterinarian: null, message: '' })

  useEffect(() => {
    let cancelled = false
    getVeterinarian(veterinarianId)
      .then((veterinarian) => {
        if (!cancelled) setResult({ status: 'ready', veterinarian, message: '' })
      })
      .catch((error) => {
        if (!cancelled) setResult({ status: 'error', veterinarian: null, message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [veterinarianId])

  const { status, veterinarian, message } = result
  const backLink = <Link to="/veterinarians">Volver al listado</Link>

  if (status === 'loading') {
    return <ScreenState state="loading" />
  }
  if (status === 'error') {
    return (
      <>
        <ScreenState state="error" message={message} />
        {backLink}
      </>
    )
  }

  const followUps = veterinarian.followUps ?? []
  const medicalEvents = veterinarian.medicalEvents ?? []

  return (
    <>
      <h1>
        {veterinarian.firstName} {veterinarian.lastName}
      </h1>

      <section className={styles.section} aria-label="Datos del veterinario">
        <p>
          <strong>Especialización:</strong> {veterinarian.specialization}
        </p>
        <p>
          <strong>Disponibilidad:</strong> {veterinarian.availability}
        </p>
        <p>
          <strong>Correo:</strong> {veterinarian.email}
        </p>
        <p>
          <strong>Teléfono:</strong> {veterinarian.phone}
        </p>
      </section>

      <section className={styles.section} aria-labelledby="follow-ups-title">
        <h2 id="follow-ups-title">Seguimientos</h2>
        {followUps.length === 0 ? (
          <p>Este veterinario no tiene seguimientos asociados.</p>
        ) : (
          <ul>
            {followUps.map((followUp) => (
              <li key={followUp.id}>
                <strong>{formatDay(followUp.date)}:</strong> {followUp.observation}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-labelledby="medical-events-title">
        <h2 id="medical-events-title">Eventos médicos</h2>
        {medicalEvents.length === 0 ? (
          <p>Este veterinario no tiene eventos médicos asociados.</p>
        ) : (
          <ul>
            {medicalEvents.map((event) => (
              <li key={event.id}>
                <strong>{formatDay(event.date)} · {event.type}:</strong> {event.description}
              </li>
            ))}
          </ul>
        )}
      </section>

      {backLink}
    </>
  )
}
