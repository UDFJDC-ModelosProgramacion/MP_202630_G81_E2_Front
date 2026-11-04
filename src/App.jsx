import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import MedicalEventDetailPage from './pages/MedicalEventDetailPage/MedicalEventDetailPage'
import MedicalEventEditPage from './pages/MedicalEventEditPage/MedicalEventEditPage'
import MedicalEventHistoryPage from './pages/MedicalEventHistoryPage/MedicalEventHistoryPage'
import MedicalEventsPage from './pages/MedicalEventsPage/MedicalEventsPage'
import TrialCohabitationRequestPage from './pages/TrialCohabitationRequestPage/TrialCohabitationRequestPage'
import MedicalEventRegisterPage from './pages/MedicalEventRegisterPage/MedicalEventRegisterPage'
import RegisterVeterinarianPage from './pages/RegisterVeterinarianPage/RegisterVeterinarianPage'
import PetRegisterPage from './pages/PetRegisterPage/PetRegisterPage'
import ShelterRegisterPage from './pages/ShelterRegisterPage/ShelterRegisterPage'
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
        <Route path="/pets" element={<Pending title="Mascotas" />} />
        <Route path="/pets/new" element={<PetRegisterPage />} />
        <Route path="/pets/:petId/medical-events" element={<MedicalEventHistoryPage />} />
        <Route path="/pets/:petId" element={<Pending title="Perfil de mascota" />} />
        <Route path="/medical-events" element={<MedicalEventsPage />} />
        <Route path="/medical-events/new" element={<MedicalEventRegisterPage />} />
        <Route path="/medical-events/:medicalEventId" element={<MedicalEventDetailPage />} />
        <Route path="/medical-events/:medicalEventId/edit" element={<MedicalEventEditPage />} />
        <Route path="/trial-cohabitation-requests" element={<Pending title="Mis solicitudes de convivencia" />} />
        <Route path="/trial-cohabitation-requests/new" element={<TrialCohabitationRequestPage />} />
        <Route path="/shelters/new" element={<ShelterRegisterPage />} />
        <Route path="/shelters/:shelterId" element={<Pending title="Detalle del refugio" />} />
        <Route path="/notifications" element={<Pending title="Notificaciones" />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/new" element={<RegisterVeterinarianPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
      </Route>
    </Routes>
  )
}