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
import OpenShifts from "./pages/OpenShifts";
import Leave from "./pages/Leave";
import Timesheet from "./pages/Timesheet";
import { ShiftProvider } from "./pages/ShiftContext"; 
import { AuthProvider } from "./context/AuthContext"; 
import { ToastContainer } from "react-toastify";
import AddAccount from "./pages/AddAccount";
import Payslip from "./pages/Payslip";
import RegularShift from "./pages/RegularShift";
import TodoOpenShifts from "./pages/TodoOpenShifts";
import TodoRegularShifts from "./pages/TodoRegularShifts"
import TodoPartTimeShifts from "./pages/TodoPartTimeShifts"
import TodoApprenticeshipShifts from "./pages/TodoApprenticeshipShifts"
import AllShifts from "./pages/AllShifts";
import EmployeeDetails from "./pages/EmployeeDetails";
import PartTimeShifts from "./pages/PartTimeShifts";
import ApprenticeshipShifts from "./pages/Apprenticeship";
import AbsentTable from "./pages/AbsentTable";

// import Hours from "./pages/Hours";

<ToastContainer /> 

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
                <Route path="/open-shifts" element={<OpenShifts />} />
                <Route path="/hours/regular-shifts" element={<RegularShift />} />
                <Route path="/hours/all-shifts" element={<AllShifts/>} />
                <Route path="/workforce" element={<Workforce />} />
                <Route path="/employee-details/:id" element={<EmployeeDetails />} />
                <Route path="/leaves" element={<Leave />} />
                <Route path="/paycheck/payslip" element={<Payslip/>} />
                <Route path="/shifts" element={<Calendar />} />
                <Route path="/utilities" element={<Calendar />} />
                <Route path="/hours/open-shifts" element={<OpenShifts />} />
                <Route path="/hours/part-time-shifts" element={<PartTimeShifts/>} />
                <Route path="/hours/apprenticeship-shifts" element={<ApprenticeshipShifts/>} />
                <Route path="/hours/absent-table" element={<AbsentTable/>} />
                <Route path="/timesheet" element={<Timesheet />} /> 
                <Route path="/todo-open-shifts" element={<TodoOpenShifts />} />
                <Route path="/todo-regular-shifts" element={<TodoRegularShifts />} />
                <Route path="/todo-part-time-shifts" element={<TodoPartTimeShifts/>} />
                <Route path="/todo-apprenticeship-shifts" element={<TodoApprenticeshipShifts/>} />
                <Route path="/add-account" element={<AddAccount onAddAccount={() => {}} />} />
                
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