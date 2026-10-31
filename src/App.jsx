import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import RegisterVeterinarianPage from './pages/RegisterVeterinarianPage/RegisterVeterinarianPage'
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
        <Route path="/notifications" element={<Pending title="Notificaciones" />} />
        <Route path="/veterinarians" element={<VeterinariansPage />} />
        <Route path="/veterinarians/new" element={<RegisterVeterinarianPage />} />
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
      </Route>
    </Routes>
  )
}
