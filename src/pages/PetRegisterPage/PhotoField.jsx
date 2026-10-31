import { useState } from 'react'
import { SelectField, TextField } from '../../components/FormField/FormField'
import FormSection from '../../components/FormSection/FormSection'
import { PHOTO_FORMATS } from '../../constants/petOptions'
import { hasPhoto, isHttpUrl } from './photoForm'
import styles from './PhotoField.module.css'

// Optional profile photo: the image link, its format and a live preview. The backend keeps
// photos as links, so the file itself is not uploaded from here.
export default function PhotoField({ values, errors, onChange }) {
  const [failedUrl, setFailedUrl] = useState('')
  const url = values.photoUrl.trim()
  const previewUrl = isHttpUrl(url) && failedUrl !== url ? url : null

  return (
    <FormSection
      title="Fotografía de perfil"
      description="Opcional. Se mostrará en la ficha de la mascota y en el catálogo de adopción."
    >
      <div className={styles.layout}>
        <div className={previewUrl ? `${styles.preview} ${styles.filled}` : styles.preview}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Vista previa de la fotografía"
              referrerPolicy="no-referrer"
              onError={() => setFailedUrl(url)}
            />
          ) : (
            <p>{failedUrl === url && url ? 'No se pudo cargar la imagen.' : 'Sin fotografía'}</p>
          )}
        </div>

        <div className={styles.fields}>
          <TextField
            id="photoUrl"
            name="photoUrl"
            label="Enlace de la fotografía"
            type="url"
            placeholder="https://ejemplo.com/luna.jpg"
            value={values.photoUrl}
            error={errors.photoUrl}
            onChange={onChange}
          />
          <SelectField
            id="photoType"
            name="photoType"
            label="Formato"
            options={PHOTO_FORMATS}
            required={hasPhoto(values)}
            value={values.photoType}
            error={errors.photoType}
            onChange={onChange}
          />
          <p className={styles.hint}>
            Use una imagen nítida y bien iluminada (JPG, PNG, WEBP, GIF o BMP). El formato se
            elige solo cuando el enlace termina en la extensión del archivo.
          </p>
        </div>
      </div>
    </FormSection>
  )
}
