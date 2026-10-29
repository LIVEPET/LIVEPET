import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useClinicAuth } from "@/contexts/clinicAuth";
import { Button } from "@/components/ui/button";

const ProtectedClinicRoute = () => {
  const location = useLocation();
  const { status, error, retry, logout } = useClinicAuth();

  if (status === "loading") {
    return <p role="status" className="p-6 text-center">Verificando sessão da clínica...</p>;
  }
  if (status === "error") {
    return (
      <div role="alert" className="space-y-4 p-6 text-center">
        <p>{error}</p>
        <Button onClick={retry}>Tentar novamente</Button>{" "}
        <Button variant="outline" onClick={logout}>Voltar ao login</Button>
      </div>
    );
  }
  if (status !== "authenticated") {
    return <Navigate to="/clinica/entrar" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedClinicRoute;
