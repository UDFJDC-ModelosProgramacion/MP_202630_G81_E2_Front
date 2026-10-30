import styles from './FormField.module.css'

const asOption = (option) =>
  typeof option === 'string' ? { value: option, label: option } : option

// Label + control + error message. The control is rendered by `children`, which receives
// the accessibility props (id, aria-required, aria-invalid, aria-describedby).
// Validation is done by our own code (CT4), so controls never use the native `required`.
export default function FormField({ id, label, required = false, error, children }) {
  const errorId = `${id}-error`
  return (
    <div className={styles.field}>
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

export function TextField({ id, label, required, error, ...inputProps }) {
  return (
    <FormField id={id} label={label} required={required} error={error}>
      {(accessibility) => <input {...accessibility} {...inputProps} />}
    </FormField>
  )
}

export function SelectField({
  id,
  label,
  required,
  error,
  options,
  placeholder = 'Seleccione',
  ...selectProps
}) {
  return (
    <FormField id={id} label={label} required={required} error={error}>
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
