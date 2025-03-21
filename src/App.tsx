import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import Verification from "./pages/AuthPages/Verification";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import PrivateRoute from "./routes/PrivateRoute";
import ToDo from "./pages/ToDo";
import Workforce from "./pages/WorkForce";
import Hours from "./pages/Hours";
import OpenShifts from "./pages/OpenShifts";
import Leave from "./pages/Leave";
import Timesheet from "./pages/Timesheet"; // ✅ Import Timesheet Page
import { ShiftProvider } from "./pages/ShiftContext"; 
import { AuthProvider } from "./context/AuthContext"; 

export default function App() {
  return (
    <AuthProvider> {/* Wrap everything with AuthProvider */}
      <ShiftProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Redirect to Sign In if no authentication */}
            <Route path="/" element={<Navigate to="/signin" replace />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Home />} />
                <Route path="/profile" element={<UserProfiles />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/todo" element={<ToDo />} />
                <Route path="/workforce" element={<Workforce />} />
                <Route path="/leaves" element={<Leave />} />
                <Route path="/hours" element={<Hours />} />
                <Route path="/paycheck" element={<Calendar />} />
                <Route path="/shifts" element={<Calendar />} />
                <Route path="/utilities" element={<Calendar />} />
                <Route path="/hours/open-shifts" element={<OpenShifts />} />
                <Route path="/timesheet" element={<Timesheet />} /> {/* ✅ Added Timesheet Page */}
              </Route>
            </Route>

            {/* Auth Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<Verification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/account/reset-password" element={<ResetPassword />} />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ShiftProvider>
    </AuthProvider>
  );
}
