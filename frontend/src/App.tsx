import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Contas } from './pages/Contas';
import { Operacoes } from './pages/Operacoes';
import { Historico } from './pages/Historico';

// Depois (export default):
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="contas" element={<Contas />} />
          <Route path="operacoes" element={<Operacoes />} />
          <Route path="historico" element={<Historico />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;