import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import StaffAuth from "./pages/StaffAuth";
import StaffPending from "./pages/StaffPending";
import StaffDashboard from "./pages/StaffDashboard";
import StaffComplaints from "./pages/StaffComplaints";
import StudentDashboard from "./pages/StudentDashboard";
import StudentSettings from "./pages/StudentSettings";
import AdminDashboard from "./pages/AdminDashboard";
import HubDetails from "./pages/HubDetails";
import AdminChat from "./pages/AdminChat";
import StudentChat from "./pages/StudentChat";
import Analytics from "./pages/Analytics";
import AdminSettings from "./pages/AdminSettings";
import AdminStaffVerification from "./pages/AdminStaffVerification";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/staff/auth" element={<StaffAuth />} />
              <Route path="/staff/pending" element={<StaffPending />} />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute requiredRole="staff">
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/complaints"
                element={
                  <ProtectedRoute requiredRole="staff">
                    <StaffComplaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/settings"
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/chat"
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/hub/:hubId"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <HubDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/chat"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminStaffVerification />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
