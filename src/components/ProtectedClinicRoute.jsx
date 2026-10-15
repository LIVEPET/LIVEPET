import { Navigate, Outlet, useLocation } from "react-router-dom";
import { clinicService } from "@/services/api";

const ProtectedClinicRoute = () => {
  const location = useLocation();

  if (!clinicService.isAuthenticated()) {
    return <Navigate to="/clinica/entrar" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedClinicRoute;
