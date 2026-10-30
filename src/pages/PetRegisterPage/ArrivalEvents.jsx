import { SelectField, TextField } from '../../components/FormField/FormField'
import { ARRIVAL_EVENT_TYPES } from '../../constants/petOptions'
import { eventKey } from './petForm'
import styles from './PetRegisterPage.module.css'

// One group per arrival event (date, type, description). At least one is required, so the
// first one cannot be removed.
export default function ArrivalEvents({ events, errors, onChange, onAdd, onRemove }) {
  return (
    <div className={styles.events}>
      <h2 className={styles.eventsTitle}>
        Evento de llegada<span aria-hidden="true">*</span> (al menos uno)
      </h2>
      {errors.events && <p className={styles.sectionError}>{errors.events}</p>}

      {events.map((event, index) => {
        const field = (name) => ({
          id: `event-${index}-${name}`,
          name,
          value: event[name],
          error: errors[eventKey(index, name)],
          required: true,
          onChange: (changeEvent) => onChange(index, name, changeEvent.target.value),
        })
        return (
          <fieldset key={event.uid} className={styles.event}>
            <legend>Evento de llegada {index + 1}</legend>
            <TextField label="Fecha" type="date" {...field('date')} />
            <SelectField
              label="Tipo"
              options={ARRIVAL_EVENT_TYPES}
              {...field('type')}
            />
            <TextField label="Descripción" placeholder="Rescatada en la calle" {...field('description')} />
            {index > 0 && (
              <button type="button" className={styles.remove} onClick={() => onRemove(index)}>
                Quitar evento {index + 1}
              </button>
            )}
          </fieldset>
        )
      })}

      <button type="button" className={styles.addEvent} onClick={onAdd}>
        + Agregar otro evento
      </button>
    </div>
  )
}
