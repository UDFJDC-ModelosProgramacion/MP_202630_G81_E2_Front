import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import MedicalEventDetailPage from './pages/MedicalEventDetailPage/MedicalEventDetailPage'
import MedicalEventEditPage from './pages/MedicalEventEditPage/MedicalEventEditPage'
import MedicalEventHistoryPage from './pages/MedicalEventHistoryPage/MedicalEventHistoryPage'
import MedicalEventsPage from './pages/MedicalEventsPage/MedicalEventsPage'
import MedicalEventRegisterPage from './pages/MedicalEventRegisterPage/MedicalEventRegisterPage'
import RegisterVeterinarianPage from './pages/RegisterVeterinarianPage/RegisterVeterinarianPage'
import PetRegisterPage from './pages/PetRegisterPage/PetRegisterPage'
import ShelterListPage from './pages/ShelterListPage/ShelterListPage'
import ShelterRegisterPage from './pages/ShelterRegisterPage/ShelterRegisterPage'
import VeterinarianProfilePage from './pages/VeterinarianProfilePage/VeterinarianProfilePage'
import VeterinariansPage from './pages/VeterinariansPage/VeterinariansPage'
import UpdateVeterinarianPage from './pages/UpdateVeterinarianPage/UpdateVeterinarianPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/veterinarians" replace />} />
        <Route path="/pets" element={<Pending title="Mascotas" />} />
        <Route path="/adopters/new" element={<AdopterRegisterPage />} />
        <Route path="/adopters" element={<AdoptersPage />} />
        <Route path="/adopters/:adopterId" element={<AdopterDetailPage />} />
        <Route path="/adopters/:adopterId/edit" element={<AdopterEditPage />} />
        <Route path="/adoptions/:adoptionId/followUps/new" element={<FollowUpRegisterPage />} />
        <Route
          path="/adoptions/:adoptionId/followUps/:followUpId/edit"
          element={<FollowUpEditPage />}
        />
        <Route path="/adoptions/:adoptionId/followUps" element={<FollowUpsPage />} />
        <Route path="/followUps" element={<FollowUpsIndexPage />} />
        <Route path="/notifications" element={<Pending title="Notificaciones" />} />
        <Route path="/pets/new" element={<PetRegisterPage />} />
        <Route path="/pets/:petId/medical-events" element={<MedicalEventHistoryPage />} />
        <Route path="/pets/:petId" element={<Pending title="Perfil de mascota" />} />
        <Route path="/medical-events" element={<MedicalEventsPage />} />
        <Route path="/medical-events/new" element={<MedicalEventRegisterPage />} />
        <Route path="/medical-events/:medicalEventId" element={<MedicalEventDetailPage />} />
        <Route path="/medical-events/:medicalEventId/edit" element={<MedicalEventEditPage />} />
        <Route path="/shelters/new" element={<ShelterRegisterPage />} />
        <Route path="/shelters/:shelterId" element={<PendingPage title="Detalle del refugio" />} />
        <Route path="/notifications" element={<PendingPage title="Notificaciones" />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
        <Route path="/veterinarians/:veterinarianId/edit" element={<UpdateVeterinarianPage />} />
      </Route>
    </Routes>
  )
}