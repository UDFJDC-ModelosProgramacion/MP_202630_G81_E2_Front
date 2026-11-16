import { TextField } from '../FormField/FormField'
import styles from './UserContactFields.module.css'

export default function UserContactFields({ values, errors, onChange, phoneLabel = 'Teléfono' }) {
  return (
    <>
      <div className={styles.row}>
        <TextField
          id="firstName"
          name="firstName"
          label="Nombre"
          value={values.firstName}
          onChange={onChange}
          error={errors.firstName}
          required
        />
        <TextField
          id="lastName"
          name="lastName"
          label="Apellido"
          value={values.lastName}
          onChange={onChange}
          error={errors.lastName}
          required
        />
      </div>

      <TextField
        id="email"
        name="email"
        type="email"
        label="Correo Electrónico"
        value={values.email}
        onChange={onChange}
        error={errors.email}
        required
      />

      <TextField
        id="phone"
        name="phone"
        type="tel"
        label={phoneLabel}
        value={values.phone}
        onChange={onChange}
        error={errors.phone}
      />
    </>
  )
}
