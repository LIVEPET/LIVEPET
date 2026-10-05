import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initVersionChecker } from "./services/versionChecker";

// Inicia verificação contínua de novas versões e deploys no Render
initVersionChecker();

createRoot(document.getElementById("root")).render(<App />);