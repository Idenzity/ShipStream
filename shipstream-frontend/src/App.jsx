import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import ShipmentDetails from "./pages/ShipmentDetails";
import Plans from "./pages/Plans";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          {/* For Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* For Pages requiring authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route
              path="/shipments/:id"
              element={<ShipmentDetails />}
            />
          </Route>
          <Route path="/plans" element={<Plans />} />

          {/* For Unknown URLs */}
          <Route
            path="*"
            element={<h2 className="not-found">Page not found.</h2>}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;