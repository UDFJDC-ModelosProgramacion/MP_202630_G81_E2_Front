import { useEffect, useState } from 'react'
import FollowUpCard from '../../components/FollowUpCard/FollowUpCard'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { getVeterinarian } from '../../services/veterinarianService'
import { sortByDateDesc } from '../../utils/followUpDates'
import styles from './FollowUpsIndexPage.module.css'

// Index of the follow-ups assigned to the logged veterinarian. The detail of the
// veterinarian already carries its follow-ups with their adoption, so no global
// endpoint is needed.
export default function FollowUpsIndexPage() {
  const session = getSession()
  const isVeterinarian = session.role === ROLES.VETERINARIAN
  const [result, setResult] = useState({ status: 'loading', followUps: [], message: '' })

  useEffect(() => {
    if (!isVeterinarian) return undefined
    let active = true
    getVeterinarian(session.userId)
      .then((veterinarian) => {
        if (!active) return
        setResult({
          status: 'ready',
          followUps: sortByDateDesc(veterinarian.followUps ?? []),
          message: '',
        })
      })
      .catch((error) => {
        if (active) setResult({ status: 'error', followUps: [], message: error.message })
      })
    return () => {
      active = false
    }
  }, [isVeterinarian, session.userId])

  const { status, followUps, message } = result

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Mis seguimientos</h1>

      {!isVeterinarian ? (
        <ScreenState
          state="error"
          message="Solo el veterinario tiene un índice de seguimientos propios."
        />
      ) : (
        <>
          {status === 'loading' && <ScreenState state="loading" />}
          {status === 'error' && <ScreenState state="error" message={message} />}
          {status === 'ready' && followUps.length === 0 && (
            <ScreenState state="empty" message="Aún no tiene seguimientos asignados." />
          )}
          {status === 'ready' && followUps.length > 0 && (
            <ul className={styles.list} aria-label="Índice de seguimientos">
              {followUps.map((followUp) => (
                <FollowUpCard key={followUp.id} followUp={followUp} showAdoption />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
