import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Layout from "./components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Pets from "./pages/Pets";
import Pedigree from "./pages/Pedigree";
import Tasks from "./pages/Tasks";
import Partnerships from "./pages/Partnerships";
import MedicalHistory from "./pages/MedicalHistory";
import PetRegister from "./pages/PetRegister";
import MatchPet from "./pages/MatchPet";
import PetCard from "./pages/PetCard";
import NotFound from "./pages/NotFound";

import ClinicLogin from "./pages/Clinic/ClinicLogin.jsx";
import ClinicLayout from "./pages/Clinic/ClinicLayout.jsx";
import ClinicDashboard from "./pages/Clinic/ClinicDashboard.jsx";
import ClinicPatients from "./pages/Clinic/ClinicPatients.jsx";
import ClinicProfile from "./pages/Clinic/ClinicProfile.jsx";
import ClinicSchedule from "./pages/Clinic/ClinicSchedule.jsx";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/clinica/entrar" element={<ClinicLogin />} />
          <Route path="/clinica" element={<ClinicLayout />}>
            <Route index element={<ClinicDashboard />} />
            <Route path="agenda" element={<ClinicSchedule />} />
            <Route path="pacientes" element={<ClinicPatients />} />
            <Route path="perfil" element={<ClinicProfile />} />
          </Route>

          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/pedigree" element={<Pedigree />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/parcerias" element={<Partnerships />} />
            <Route path="/historico-medico" element={<MedicalHistory />} />
            <Route path="/pets/novo" element={<PetRegister />} />
            <Route path="/matchpet" element={<MatchPet />} />
            <Route path="/cartao" element={<PetCard />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;