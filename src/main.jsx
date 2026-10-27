
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import App from "./App.jsx";
import DhikrDetail from "./DhikrDetail.jsx";
import Auth from "./Auth.jsx";
import "./index.css";

function ProtectedDhikr() {
  const location = useLocation();
  const token = localStorage.getItem("tasbih-token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          loginFirst: true,
        }}
      />
    );
  }

  return <DhikrDetail />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dhikr/:slug" element={<ProtectedDhikr />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
