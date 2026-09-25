import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.jsx";
import Login from "./pages/Login.jsx";
import Pets from "./pages/Pets.jsx";
import Pedigree from "./pages/Pedigree.jsx";
import Tasks from "./pages/Tasks.jsx";
import Partnerships from "./pages/Partnerships.jsx";
import MedicalHistory from "./pages/MedicalHistory.jsx";
import PetRegister from "./pages/PetRegister.jsx";
import MatchPet from "./pages/MatchPet.jsx";
import PetHealth from "./pages/PetHealth.jsx";
import PetCard from "./pages/PetCard.jsx";
import NotFound from "./pages/NotFound.jsx";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Login fora do layout (sem menu) */}
          <Route path="/login" element={<Login />} />

          {/* Todas as outras telas compartilham o Header */}
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/pedigree" element={<Pedigree />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/parcerias" element={<Partnerships />} />
            <Route path="/historico-medico" element={<MedicalHistory />} />
            <Route path="/pets/novo" element={<PetRegister />} />
            <Route path="/matchpet" element={<MatchPet />} />
            <Route path="/saude" element={<PetHealth />} />
            <Route path="/cartao" element={<PetCard />} />
            {/* Mantenha o coringa como última rota */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;