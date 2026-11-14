import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import AdopterDetailPage from './pages/AdopterDetailPage/AdopterDetailPage'
import AdopterEditPage from './pages/AdopterEditPage/AdopterEditPage'
import AdopterRegisterPage from './pages/AdopterRegisterPage/AdopterRegisterPage'
import AdoptersPage from './pages/AdoptersPage/AdoptersPage'
import FollowUpRegisterPage from './pages/FollowUpRegisterPage/FollowUpRegisterPage'
import FollowUpEditPage from './pages/FollowUpEditPage/FollowUpEditPage'
import FollowUpsIndexPage from './pages/FollowUpsIndexPage/FollowUpsIndexPage'
import FollowUpsPage from './pages/FollowUpsPage/FollowUpsPage'
import PendingPage from './components/PendingPage/PendingPage'
import PetRegisterPage from './pages/PetRegisterPage/PetRegisterPage'
import ShelterListPage from './pages/ShelterListPage/ShelterListPage'
import ShelterRegisterPage from './pages/ShelterRegisterPage/ShelterRegisterPage'
import VeterinarianProfilePage from './pages/VeterinarianProfilePage/VeterinarianProfilePage'
import VeterinariansPage from './pages/VeterinariansPage/VeterinariansPage'

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
        <Route path="/pets/:petId" element={<PendingPage title="Perfil de mascota" />} />
        <Route path="/shelters" element={<ShelterListPage />} />
        <Route path="/shelters/new" element={<ShelterRegisterPage />} />
        <Route path="/shelters/:shelterId" element={<PendingPage title="Detalle del refugio" />} />
        <Route path="/notifications" element={<PendingPage title="Notificaciones" />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
      </Route>
    </Routes>
  )
}