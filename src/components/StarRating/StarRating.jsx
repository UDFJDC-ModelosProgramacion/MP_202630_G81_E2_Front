import { MAX_RATING, ratingLabel } from '../../utils/reviews'
import styles from './StarRating.module.css'

const STARS = Array.from({ length: MAX_RATING }, (_, index) => index + 1)


export function Stars({ rating, label }) {
    const filled = Math.round(rating)
    return (
        <span className={styles.stars} role="img" aria-label={label ?? ratingLabel(rating)}>
            {STARS.map((star) => (
                <span key={star} aria-hidden="true" className={star <= filled ? styles.on : styles.off}>
                    {star <= filled ? '★' : '☆'}
                </span>
            ))}
        </span>
    )
}


export default function StarRating({ id, label, value, error, onChange }) {
    const labelId = `${id}-label`
    const errorId = `${id}-error`

    return (
        <div className={styles.field}>
            <span id={labelId} className={styles.label}>
                {label}
                <span aria-hidden="true">*</span>
            </span>
            <div
                id={id}
                role="radiogroup"
                tabIndex={-1}
                aria-labelledby={labelId}
                aria-required="true"
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? errorId : undefined}
                className={styles.group}
            >
                {STARS.map((star) => (
                    <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={value === star}
                        aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
                        className={star <= value ? `${styles.star} ${styles.on}` : styles.star}
                        onClick={() => onChange(star)}
                    >
                        {star <= value ? '★' : '☆'}
                    </button>
                ))}
                <span className={styles.value}>{value ? ratingLabel(value) : 'Sin calificar'}</span>
            </div>
            {error && (
                <p id={errorId} className={styles.error}>
                    {error}
                </p>
            )}
        </div>
    )
}