import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import PendingPage from './components/PendingPage/PendingPage'
import PetRegisterPage from './pages/PetRegisterPage/PetRegisterPage'
import ShelterListPage from './pages/ShelterListPage/ShelterListPage'
import ShelterRegisterPage from './pages/ShelterRegisterPage/ShelterRegisterPage'
import VeterinarianProfilePage from './pages/VeterinarianProfilePage/VeterinarianProfilePage'
import VeterinariansPage from './pages/VeterinariansPage/VeterinariansPage'
import NotificationsPage from './pages/NotificationsPage/NotificationsPage'
import ScheduleNotificationPage from './pages/ScheduleNotificationPage/ScheduleNotificationPage'
import EditNotificationPage from './pages/EditNotificationPage/EditNotificationPage'

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
        <Route path="/shelters/:shelterId" element={<PendingPage title="Detalle del refugio" />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/notifications/new" element={<ScheduleNotificationPage />} />
        <Route path="/notifications/:notificationId/edit" element={<EditNotificationPage />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
      </Route>
    </Routes>
  )
}