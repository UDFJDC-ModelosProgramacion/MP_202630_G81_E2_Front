import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import {
    deleteVaccinationRecord,
    getVaccinationRecordByPet,
} from '../../services/vaccinationRecordService'
import { formatShortDate } from '../../utils/dateFields'
import { isApplied, sortVaccines, vaccineStatusLabel } from '../../utils/vaccination'
import styles from './PetVaccinationRecordPage.module.css'

const NOT_FOUND = 404

export default function PetVaccinationRecordPage() {
    const { petId } = useParams()
    const { state } = useLocation()
    const isAdmin = getSession().role === ROLES.SHELTER_ADMIN


    const [result, setResult] = useState({ key: null, status: 'ready', record: null, message: '' })
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [errorDialog, setErrorDialog] = useState(null)

    useEffect(() => {
        let cancelled = false
        getVaccinationRecordByPet(petId)
            .then((record) => {
                if (!cancelled) setResult({ key: petId, status: 'ready', record, message: '' })
            })
            .catch((error) => {
                if (cancelled) return
                const status = error.status === NOT_FOUND ? 'missing' : 'error'
                setResult({ key: petId, status, record: null, message: error.message })
            })
        return () => {
            cancelled = true
        }
    }, [petId])

    async function confirmDelete() {
        setConfirmingDelete(false)
        setDeleting(true)
        try {
            await deleteVaccinationRecord(result.record.id)
            setResult({ key: petId, status: 'deleted', record: null, message: '' })
        } catch (error) {
            setErrorDialog({ message: error.message, status: error.status })
        }
        setDeleting(false)
    }

    const createLink = isAdmin && (
        <Link to={`/vaccination-records/new?petId=${petId}`}>Crear carnet de vacunación</Link>
    )

    let content
    if (result.key !== petId) content = <ScreenState state="loading" />
    else if (result.status === 'error') {
        content = (
            <>
                <ScreenState state="error" message={result.message} />
                <Link to={`/pets/${petId}`}>Volver a la mascota</Link>
            </>
        )
    } else if (result.status === 'deleted') {
        content = (
            <>
                <p role="status" className={styles.success}>
                    El carnet de vacunación se eliminó correctamente.
                </p>
                {createLink}
            </>
        )
    } else if (result.status === 'missing') {
        content = (
            <>
                <ScreenState state="empty" message="Esta mascota todavía no tiene carnet de vacunación." />
                {createLink}
            </>
        )
    } else {
        const { record } = result
        const vaccines = sortVaccines(record.vaccines ?? [])
        const petName = record.pet?.name ?? '—'
        content = (
            <>
                <p className={styles.pet}>
                    <strong>Mascota:</strong> <span className={styles.pill}>{petName}</span>
                    <span className={styles.number}>Carnet No. {record.id}</span>
                </p>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th scope="col">Vacuna</th>
                            <th scope="col">Aplicación</th>
                            <th scope="col">Próxima dosis</th>
                            <th scope="col">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vaccines.length === 0 ? (
                            <tr>
                                <td colSpan={4}>Este carnet aún no tiene vacunas registradas.</td>
                            </tr>
                        ) : (
                            vaccines.map((vaccine) => (
                                <tr key={vaccine.id}>
                                    <th scope="row">{vaccine.name}</th>
                                    <td>{formatShortDate(vaccine.administrationDate)}</td>
                                    <td>{formatShortDate(vaccine.nextAdministration)}</td>
                                    <td>
                                        <span
                                            className={
                                                isApplied(vaccine) ? `${styles.status} ${styles.applied}` : styles.status
                                            }
                                        >
                                            {vaccineStatusLabel(vaccine)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {isAdmin && (
                    <button
                        type="button"
                        className={styles.delete}
                        disabled={deleting}
                        onClick={() => setConfirmingDelete(true)}
                    >
                        Eliminar carnet
                    </button>
                )}
                {confirmingDelete && (
                    <ConfirmDialog
                        title="¿Eliminar carnet de vacunación?"
                        confirmLabel="Eliminar"
                        message={`Se eliminará de forma permanente el carnet de ${petName}. Solo es posible cuando la mascota ya fue adoptada.`}
                        onConfirm={confirmDelete}
                        onCancel={() => setConfirmingDelete(false)}
                    />
                )}
            </>
        )
    }

    return (
        <section className={styles.page}>
            <h1 className={styles.title}>Carnet de vacunación</h1>
            {state?.created && result.status === 'ready' && (
                <p role="status" className={styles.success}>
                    El carnet de vacunación se creó correctamente.
                </p>
            )}
            {deleting && <ScreenState state="loading" message="Eliminando..." />}
            {content}
            {errorDialog && (
                <ErrorDialog
                    title="Error al eliminar el carnet"
                    message={errorDialog.message}
                    status={errorDialog.status}
                    hint="El carnet solo puede eliminarse cuando la mascota ya fue adoptada."
                    actionLabel="Entendido"
                    onClose={() => setErrorDialog(null)}
                />
            )}
        </section>
    )
}