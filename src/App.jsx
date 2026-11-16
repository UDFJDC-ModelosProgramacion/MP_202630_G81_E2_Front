import { Route, Routes } from 'react-router-dom'
import useAuth from './auth/useAuth'
import Layout from './components/Layout/Layout'
import PendingPage from './components/PendingPage/PendingPage'
import AdopterDetailPage from './pages/AdopterDetailPage/AdopterDetailPage'
import AdopterEditPage from './pages/AdopterEditPage/AdopterEditPage'
import AdopterRegisterPage from './pages/AdopterRegisterPage/AdopterRegisterPage'
import AdoptersPage from './pages/AdoptersPage/AdoptersPage'
import CreateVaccinationRecordPage from './pages/CreateVaccinationRecordPage/CreateVaccinationRecordPage'
import EditReviewPage from './pages/EditReviewPage/EditReviewPage'
import FollowUpEditPage from './pages/FollowUpEditPage/FollowUpEditPage'
import FollowUpRegisterPage from './pages/FollowUpRegisterPage/FollowUpRegisterPage'
import FollowUpsIndexPage from './pages/FollowUpsIndexPage/FollowUpsIndexPage'
import FollowUpsPage from './pages/FollowUpsPage/FollowUpsPage'
import HomePage from './pages/HomePage/HomePage'
import LoginPage from './pages/LoginPage/LoginPage'
import MedicalEventDetailPage from './pages/MedicalEventDetailPage/MedicalEventDetailPage'
import MedicalEventEditPage from './pages/MedicalEventEditPage/MedicalEventEditPage'
import MedicalEventHistoryPage from './pages/MedicalEventHistoryPage/MedicalEventHistoryPage'
import MedicalEventRegisterPage from './pages/MedicalEventRegisterPage/MedicalEventRegisterPage'
import MedicalEventsPage from './pages/MedicalEventsPage/MedicalEventsPage'
import PetDetailPage from './pages/PetDetailPage/PetDetailPage'
import PetInventoryPage from './pages/PetInventoryPage/PetInventoryPage'
import PetsPage from './pages/PetsPage/PetsPage'
import PetRegisterPage from './pages/PetRegisterPage/PetRegisterPage'
import PetReviewsPage from './pages/PetReviewsPage/PetReviewsPage'
import PetVaccinationRecordPage from './pages/PetVaccinationRecordPage/PetVaccinationRecordPage'
import RegisterVeterinarianPage from './pages/RegisterVeterinarianPage/RegisterVeterinarianPage'
import ShelterDetailPage from './pages/ShelterDetailPage/ShelterDetailPage'
import ShelterListPage from './pages/ShelterListPage/ShelterListPage'
import ShelterRegisterPage from './pages/ShelterRegisterPage/ShelterRegisterPage'
import UpdateVeterinarianPage from './pages/UpdateVeterinarianPage/UpdateVeterinarianPage'
import UserProfilePage from './pages/UserProfilePage/UserProfilePage'
import UserRegisterPage from './pages/UserRegisterPage/UserRegisterPage'
import VeterinarianProfilePage from './pages/VeterinarianProfilePage/VeterinarianProfilePage'
import VeterinariansPage from './pages/VeterinariansPage/VeterinariansPage'
import WriteReviewPage from './pages/WriteReviewPage/WriteReviewPage'

export default function App() {
  useAuth()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />

        {/* Usuarios */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<UserRegisterPage />} />
        <Route path="/profile" element={<UserProfilePage />} />

        {/* Mascotas */}
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/pets/inventory" element={<PetInventoryPage />} />
        <Route path="/pets/new" element={<PetRegisterPage />} />
        <Route path="/pets/:petId" element={<PetDetailPage />} />
        <Route path="/pets/:petId/medical-events" element={<MedicalEventHistoryPage />} />
        <Route path="/pets/:petId/reviews" element={<PetReviewsPage />} />
        <Route path="/pets/:petId/reviews/new" element={<WriteReviewPage />} />
        <Route path="/pets/:petId/reviews/:reviewId/edit" element={<EditReviewPage />} />
        <Route path="/pets/:petId/vaccination-record" element={<PetVaccinationRecordPage />} />
        <Route path="/vaccination-records/new" element={<CreateVaccinationRecordPage />} />

        {/* Refugios y eventos */}
        <Route path="/shelters" element={<ShelterListPage />} />
        <Route path="/shelters/new" element={<ShelterRegisterPage />} />
        <Route path="/shelters/:shelterId" element={<ShelterDetailPage />} />
        <Route path="/shelters/:shelterId/edit" element={<PendingPage title="Editar refugio" />} />
        <Route
          path="/shelters/:shelterId/events/new"
          element={<PendingPage title="Crear evento" />}
        />
        <Route path="/events/:eventId" element={<PendingPage title="Detalle del evento" />} />

        {/* Eventos médicos */}
        <Route path="/medical-events" element={<MedicalEventsPage />} />
        <Route path="/medical-events/new" element={<MedicalEventRegisterPage />} />
        <Route path="/medical-events/:medicalEventId" element={<MedicalEventDetailPage />} />
        <Route path="/medical-events/:medicalEventId/edit" element={<MedicalEventEditPage />} />

        {/* Veterinarios */}
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/new" element={<RegisterVeterinarianPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
        <Route path="/veterinarians/:veterinarianId/edit" element={<UpdateVeterinarianPage />} />

        {/* Adoptantes y seguimientos */}
        <Route path="/adopters" element={<AdoptersPage />} />
        <Route path="/adopters/new" element={<AdopterRegisterPage />} />
        <Route path="/adopters/:adopterId" element={<AdopterDetailPage />} />
        <Route path="/adopters/:adopterId/edit" element={<AdopterEditPage />} />
        <Route path="/followUps" element={<FollowUpsIndexPage />} />
        <Route path="/adoptions/:adoptionId/followUps" element={<FollowUpsPage />} />
        <Route path="/adoptions/:adoptionId/followUps/new" element={<FollowUpRegisterPage />} />
        <Route
          path="/adoptions/:adoptionId/followUps/:followUpId/edit"
          element={<FollowUpEditPage />}
        />

        {/* Otros */}
        <Route path="/notifications" element={<PendingPage title="Notificaciones" />} />
      </Route>
    </Routes>
  )
}