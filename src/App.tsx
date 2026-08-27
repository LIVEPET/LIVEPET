import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Pets from "./pages/Pets.tsx";
import Pedigree from "./pages/Pedigree.tsx";
import Tasks from "./pages/Tasks.tsx";
import Partnerships from "./pages/Partnerships.tsx";
import MedicalHistory from "./pages/MedicalHistory.tsx";
import PetRegister from "./pages/PetRegister.tsx";
import MatchPet from "./pages/MatchPet.tsx";

import PetCard from "./pages/PetCard.tsx";
import NotFound from "./pages/NotFound.tsx";
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
            
            <Route path="/cartao" element={<PetCard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
