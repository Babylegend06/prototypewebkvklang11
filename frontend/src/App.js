import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import KioskHome from "@/pages/KioskHome";
import PaymentPage from "@/pages/PaymentPage";
import OwnerDashboard from "@/pages/OwnerDashboard";
import LoginPage from "@/pages/LoginPage";
import AuthCallback from "@/pages/AuthCallback";
import ProtectedRoute from "@/components/ProtectedRoute";
import InstructionsPage from "@/pages/InstructionsPage";

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<KioskHome />} />
      <Route path="/payment/:machineId" element={<PaymentPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <OwnerDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-center" />
      </BrowserRouter>
    </div>
  );
}

export default App;