import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth Provider
import { AdminAuthProvider } from "./hooks/useAdminAuth";

// Layouts
import { StudentLayout } from "./components/layout/StudentLayout";
import { AdminLayout } from "./components/admin/AdminLayout";

// Student Pages
import { HomePage } from "./pages/student/HomePage";
import { FacilitiesPage } from "./pages/student/FacilitiesPage";
import { BookingPage } from "./pages/student/BookingPage";
import { MyRequestsPage } from "./pages/student/MyRequestsPage";
import { RequestDetailPage } from "./pages/student/RequestDetailPage";
import { InstallPage } from "./pages/student/InstallPage";

// Admin Pages
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminForgotPassword } from "./pages/admin/AdminForgotPassword";
import { AdminChangePassword } from "./pages/admin/AdminChangePassword";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminFacilities } from "./pages/admin/AdminFacilities";
import { AdminRequests } from "./pages/admin/AdminRequests";
import { AdminStudents } from "./pages/admin/AdminStudents";
import { AddAdmin } from "./pages/admin/AddAdmin";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminAuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Student Routes (PWA) */}
            <Route element={<StudentLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/facilities" element={<FacilitiesPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/my-requests" element={<MyRequestsPage />} />
              <Route path="/my-requests/:id" element={<RequestDetailPage />} />
              <Route path="/install" element={<InstallPage />} />
            </Route>

            {/* Admin Auth Routes - URL rahasia */}
            <Route path="/portal-mgmt-2026" element={<AdminLogin />} />
            <Route path="/portal-mgmt-2026/forgot-password" element={<AdminForgotPassword />} />

            {/* Admin Dashboard Routes */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/facilities" element={<AdminFacilities />} />
              <Route path="/admin/requests" element={<AdminRequests />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/change-password" element={<AdminChangePassword />} />
              <Route path="/admin/add-admin" element={<AddAdmin />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
