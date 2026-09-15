import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './store/useStore';
import { applicaTema, ascoltaSistema } from './lib/theme';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Allena from './pages/Allena';
import ProgramDetail from './pages/ProgramDetail';
import WorkoutDetail from './pages/WorkoutDetail';
import Sessione from './pages/Sessione';
import Esercizi from './pages/Esercizi';
import EsercizioDetail from './pages/EsercizioDetail';
import Piano from './pages/Piano';
import Dieta from './pages/Dieta';
import RicettaDetail from './pages/RicettaDetail';
import Integratori from './pages/Integratori';
import Spesa from './pages/Spesa';
// i grafici (recharts) pesano: caricati solo quando servono
const Progressi = lazy(() => import('./pages/Progressi'));
import Profilo from './pages/Profilo';
import Storico from './pages/Storico';

export default function App() {
  const fatto = useStore((s) => s.onboardingFatto);
  const tema = useStore((s) => s.tema);

  useEffect(() => {
    applicaTema(tema);
    return ascoltaSistema(tema, () => applicaTema(tema));
  }, [tema]);

  if (!fatto) return <Onboarding />;

  return (
    <Layout>
      <Suspense fallback={<p className="py-16 text-center text-sm text-muted">Caricamento…</p>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/allena" element={<Allena />} />
        <Route path="/allena/programma/:id" element={<ProgramDetail />} />
        <Route path="/allena/workout/:programId/:workoutId" element={<WorkoutDetail />} />
        <Route path="/esercizi" element={<Esercizi />} />
        <Route path="/esercizi/:id" element={<EsercizioDetail />} />
        <Route path="/sessione" element={<Sessione />} />
        <Route path="/piano" element={<Piano />} />
        <Route path="/dieta" element={<Dieta />} />
        <Route path="/dieta/ricetta/:id" element={<RicettaDetail />} />
        <Route path="/integratori" element={<Integratori />} />
        <Route path="/spesa" element={<Spesa />} />
        <Route path="/progressi" element={<Progressi />} />
        <Route path="/storico" element={<Storico />} />
        <Route path="/profilo" element={<Profilo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Layout>
  );
}
