import styles from './FormActions.module.css'

export default function FormActions({ submitLabel, submitting, onCancel }) {
  return (
    <div className={styles.footer}>
      <p className={styles.hint}>*Campos obligatorios</p>
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitLabel}
        </button>
      </div>
    </div>
  )
}