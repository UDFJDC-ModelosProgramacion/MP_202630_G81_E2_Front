import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import AdopterDetailPage from './pages/AdopterDetailPage/AdopterDetailPage'
import AdopterRegisterPage from './pages/AdopterRegisterPage/AdopterRegisterPage'
import AdoptersPage from './pages/AdoptersPage/AdoptersPage'
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
        <Route path="/adopters/new" element={<AdopterRegisterPage />} />
        <Route path="/adopters" element={<AdoptersPage />} />
        <Route path="/adopters/:adopterId" element={<AdopterDetailPage />} />
        <Route path="/notifications" element={<Pending title="Notificaciones" />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
      </Route>
    </Routes>
  )
}
