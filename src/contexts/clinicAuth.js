import { createContext, useContext } from "react";

export const ClinicAuthContext = createContext(null);
export const useClinicAuth = () => useContext(ClinicAuthContext);
