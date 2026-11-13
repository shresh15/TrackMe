import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import LandingPage from "./Components/LandingPage";
import Login from "./Components/Login";
import Applications from "./Components/Applications";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            {({ user }) => <Applications user={user} />}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
