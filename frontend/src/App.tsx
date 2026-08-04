import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AgendaPage } from './pages/AgendaPage';
import { BookingGatewayPage } from './pages/BookingGatewayPage';
import { BookingPage } from './pages/BookingPage';
import { ClinicalRecordsPage } from './pages/ClinicalRecordsPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { PatientsPage } from './pages/PatientsPage';
import { RegisterPage } from './pages/RegisterPage';
import { SupportPage } from './pages/SupportPage';
import { AdminProfessionalsPage } from './pages/admin/AdminProfessionalsPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { BillingPage } from './pages/admin/BillingPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { ProfessionalAvailabilityPage } from './pages/professional/ProfessionalAvailabilityPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<Layout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/acceso" element={<BookingGatewayPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/inicio" element={<HomePage />} />
            <Route path="/soporte" element={<SupportPage />} />
            <Route path="/proximamente" element={<ComingSoonPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route path="/reservar" element={<BookingPage />} />
            <Route path="/mis-turnos" element={<MyAppointmentsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/servicios" replace />} />
            <Route path="/admin/servicios" element={<AdminServicesPage />} />
            <Route path="/admin/profesionales" element={<AdminProfessionalsPage />} />
            <Route path="/cobros" element={<BillingPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['professional']} />}>
            <Route path="/profesional" element={<Navigate to="/profesional/disponibilidad" replace />} />
            <Route path="/profesional/disponibilidad" element={<ProfessionalAvailabilityPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'professional']} />}>
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/pacientes" element={<PatientsPage />} />
            <Route path="/pacientes/:id" element={<PatientDetailPage />} />
            <Route path="/historias-clinicas" element={<ClinicalRecordsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
