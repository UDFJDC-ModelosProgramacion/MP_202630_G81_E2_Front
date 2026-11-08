import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import PendingPage from './components/PendingPage/PendingPage'
import PetRegisterPage from './pages/PetRegisterPage/PetRegisterPage'
import ShelterDetailPage from './pages/ShelterDetailPage/ShelterDetailPage'
import ShelterListPage from './pages/ShelterListPage/ShelterListPage'
import ShelterRegisterPage from './pages/ShelterRegisterPage/ShelterRegisterPage'
import VeterinarianProfilePage from './pages/VeterinarianProfilePage/VeterinarianProfilePage'
import VeterinariansPage from './pages/VeterinariansPage/VeterinariansPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/veterinarians" replace />} />
        <Route path="/pets" element={<PendingPage title="Mascotas" />} />
        <Route path="/pets/new" element={<PetRegisterPage />} />
        <Route path="/pets/:petId" element={<PendingPage title="Perfil de mascota" />} />
        <Route path="/shelters" element={<ShelterListPage />} />
        <Route path="/shelters/new" element={<ShelterRegisterPage />} />
        <Route path="/shelters/:shelterId" element={<ShelterDetailPage />} />
        <Route path="/shelters/:shelterId/edit" element={<PendingPage title="Editar refugio" />} />
        <Route
          path="/shelters/:shelterId/events/new"
          element={<PendingPage title="Crear evento" />}
        />
        <Route path="/events/:eventId" element={<PendingPage title="Detalle del evento" />} />
        <Route path="/notifications" element={<PendingPage title="Notificaciones" />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
      </Route>
    </Routes>
  )
}