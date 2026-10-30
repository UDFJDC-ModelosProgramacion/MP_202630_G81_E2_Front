import styles from './FormField.module.css'

const asOption = (option) =>
  typeof option === 'string' ? { value: option, label: option } : option

// Label + control + error message. The control is rendered by `children`, which receives
// the accessibility props (id, aria-required, aria-invalid, aria-describedby).
// Validation is done by our own code (CT4), so controls never use the native `required`.
// A `wide` field takes the whole row of the grid it is in.
export default function FormField({ id, label, required = false, error, wide = false, children }) {
  const errorId = `${id}-error`
  return (
    <div className={wide ? `${styles.field} ${styles.wide}` : styles.field}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>
      {children({
        id,
        'aria-required': required,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}

export function TextField({ id, label, required, error, wide, ...inputProps }) {
  return (
    <FormField id={id} label={label} required={required} error={error} wide={wide}>
      {(accessibility) => <input {...accessibility} {...inputProps} />}
    </FormField>
  )
}

export function TextAreaField({ id, label, required, error, wide, ...textAreaProps }) {
  return (
    <FormField id={id} label={label} required={required} error={error} wide={wide}>
      {(accessibility) => <textarea {...accessibility} {...textAreaProps} />}
    </FormField>
  )
}

export function SelectField({
  id,
  label,
  required,
  error,
  wide,
  options,
  placeholder = 'Seleccione',
  ...selectProps
}) {
  return (
    <FormField id={id} label={label} required={required} error={error} wide={wide}>
      {(accessibility) => (
        <select {...accessibility} {...selectProps}>
          <option value="">{placeholder}</option>
          {options.map(asOption).map(({ value, label: optionLabel }) => (
            <option key={value} value={value}>
              {optionLabel}
            </option>
          ))}
        </select>
      )}
    </FormField>
  )
}
