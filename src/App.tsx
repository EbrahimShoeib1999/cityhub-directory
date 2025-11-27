import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import ManageShop from "./pages/dashboard/ManageShop";
import ManageImages from "./pages/dashboard/ManageImages";
import ManageHours from "./pages/dashboard/ManageHours";
import ManagePremium from "./pages/dashboard/ManagePremium";
import Profile from "./pages/dashboard/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/shop"
              element={
                <ProtectedRoute>
                  <ManageShop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/images"
              element={
                <ProtectedRoute>
                  <ManageImages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/hours"
              element={
                <ProtectedRoute>
                  <ManageHours />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/premium"
              element={
                <ProtectedRoute>
                  <ManagePremium />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
