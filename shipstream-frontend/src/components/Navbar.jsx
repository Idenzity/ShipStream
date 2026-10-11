import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      alert("Unable to log out. Please try again.");
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        ShipStream
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        
        // Checks if the user is logged in.

        {/*Logged in users will see the dashboard and track deliveries links, as well as their name and a logout button.*/}
        {!isLoading && user && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/shipments">Track Deliveries</Link>

            <span className="nav-user">
              {user.fullName}
            </span>

            <button
              type="button"
              className="nav-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}

        {/*Users who are not logged in will see the login and register links.*/}
        {!isLoading && !user && (
          <>
            <Link to="/login">Login</Link>

            <Link to="/register" className="nav-register">
              Create Account
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;