import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import PetRegisterPage from './pages/PetRegisterPage/PetRegisterPage'
import VeterinarianProfilePage from './pages/VeterinarianProfilePage/VeterinarianProfilePage'
import VeterinariansPage from './pages/VeterinariansPage/VeterinariansPage'

function Pending({ title }) {
  return <h1>{title} (pendiente)</h1>
}

// Each user story replaces the <Pending> of its own route (one line per story).
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/veterinarians" replace />} />
        <Route path="/pets" element={<Pending title="Mascotas" />} />
        <Route path="/pets/new" element={<PetRegisterPage />} />
        <Route path="/pets/:petId" element={<Pending title="Perfil de mascota" />} />
        <Route path="/notifications" element={<Pending title="Notificaciones" />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
      </Route>
    </Routes>
  )
}