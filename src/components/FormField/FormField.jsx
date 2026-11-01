import styles from './FormField.module.css'

const asOption = (option) =>
  typeof option === 'string' ? { value: option, label: option } : option

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