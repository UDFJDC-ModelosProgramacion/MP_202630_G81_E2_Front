import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import PetRegisterPage from './pages/PetRegisterPage/PetRegisterPage'
import ShelterListPage from './pages/ShelterListPage/ShelterListPage'
import ShelterRegisterPage from './pages/ShelterRegisterPage/ShelterRegisterPage'
import UserProfilePage from './pages/UserProfilePage/UserProfilePage'
import UserRegisterPage from './pages/UserRegisterPage/UserRegisterPage'
import VeterinarianProfilePage from './pages/VeterinarianProfilePage/VeterinarianProfilePage'
import VeterinariansPage from './pages/VeterinariansPage/VeterinariansPage'

function Pending({ title }) {
  return <h1>{title} (pendiente)</h1>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/veterinarians" replace />} />
        <Route path="/register" element={<UserRegisterPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/pets" element={<Pending title="Mascotas" />} />
        <Route path="/pets/new" element={<PetRegisterPage />} />
        <Route path="/pets/:petId" element={<Pending title="Perfil de mascota" />} />
        <Route path="/shelters" element={<ShelterListPage />} />
        <Route path="/shelters/new" element={<ShelterRegisterPage />} />
        <Route path="/shelters/:shelterId" element={<Pending title="Detalle del refugio" />} />
        <Route path="/notifications" element={<Pending title="Notificaciones" />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
      </Route>
    </Routes>
  )
}
