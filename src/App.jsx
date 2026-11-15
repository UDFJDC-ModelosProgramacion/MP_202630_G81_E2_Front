import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import PendingPage from './components/PendingPage/PendingPage'
import AdopterDetailPage from './pages/AdopterDetailPage/AdopterDetailPage'
import AdopterEditPage from './pages/AdopterEditPage/AdopterEditPage'
import AdopterRegisterPage from './pages/AdopterRegisterPage/AdopterRegisterPage'
import AdoptersPage from './pages/AdoptersPage/AdoptersPage'
import FollowUpEditPage from './pages/FollowUpEditPage/FollowUpEditPage'
import FollowUpRegisterPage from './pages/FollowUpRegisterPage/FollowUpRegisterPage'
import FollowUpsIndexPage from './pages/FollowUpsIndexPage/FollowUpsIndexPage'
import FollowUpsPage from './pages/FollowUpsPage/FollowUpsPage'
import MedicalEventDetailPage from './pages/MedicalEventDetailPage/MedicalEventDetailPage'
import MedicalEventEditPage from './pages/MedicalEventEditPage/MedicalEventEditPage'
import MedicalEventHistoryPage from './pages/MedicalEventHistoryPage/MedicalEventHistoryPage'
import EditReviewPage from './pages/EditReviewPage/EditReviewPage'
import MedicalEventsPage from './pages/MedicalEventsPage/MedicalEventsPage'
import MedicalEventRegisterPage from './pages/MedicalEventRegisterPage/MedicalEventRegisterPage'
import PetReviewsPage from './pages/PetReviewsPage/PetReviewsPage'
import PetVaccinationRecordPage from './pages/PetVaccinationRecordPage/PetVaccinationRecordPage'
import PetRegisterPage from './pages/PetRegisterPage/PetRegisterPage'
import ShelterListPage from './pages/ShelterListPage/ShelterListPage'
import ShelterRegisterPage from './pages/ShelterRegisterPage/ShelterRegisterPage'
import UpdateVeterinarianPage from './pages/UpdateVeterinarianPage/UpdateVeterinarianPage'
import UserRegisterPage from './pages/UserRegisterPage/UserRegisterPage'
import VeterinarianProfilePage from './pages/VeterinarianProfilePage/VeterinarianProfilePage'
import VeterinariansPage from './pages/VeterinariansPage/VeterinariansPage'
import WriteReviewPage from './pages/WriteReviewPage/WriteReviewPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/veterinarians" replace />} />
        <Route path="/register" element={<UserRegisterPage />} />
        <Route path="/profile" element={<PendingPage title="Perfil de usuario" />} />
        <Route path="/pets" element={<PendingPage title="Mascotas" />} />
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
        <Route path="/pets/new" element={<PetRegisterPage />} />
        <Route path="/pets/:petId/medical-events" element={<MedicalEventHistoryPage />} />
        <Route path="/pets/:petId" element={<PendingPage title="Perfil de mascota" />} />
        <Route path="/pets/:petId/reviews" element={<PetReviewsPage />} />
        <Route path="/pets/:petId/reviews/new" element={<WriteReviewPage />} />
        <Route path="/pets/:petId/reviews/:reviewId/edit" element={<EditReviewPage />} />
        <Route path="/pets/:petId/vaccination-record" element={<PetVaccinationRecordPage />} />
        <Route path="/medical-events" element={<MedicalEventsPage />} />
        <Route path="/medical-events/new" element={<MedicalEventRegisterPage />} />
        <Route path="/medical-events/:medicalEventId" element={<MedicalEventDetailPage />} />
        <Route path="/medical-events/:medicalEventId/edit" element={<MedicalEventEditPage />} />
        <Route path="/shelters/new" element={<ShelterRegisterPage />} />
        <Route path="/shelters" element={<ShelterListPage />} />
        <Route path="/shelters/:shelterId" element={<PendingPage title="Detalle del refugio" />} />
        <Route path="/notifications" element={<PendingPage title="Notificaciones" />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
        <Route path="/veterinarians/:veterinarianId/edit" element={<UpdateVeterinarianPage />} />
      </Route>
    </Routes>
  )
}
