import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">

      <Link to="/" className="logo">
        ShipStream
      </Link>

      <div className="nav-links">

        <Link to="/">
          Home
        </Link>

        <Link to="/shipments">
          Track Delivery
        </Link>

        <Link to="/login">
          Login
        </Link>

        <Link
          to="/register"
          className="nav-register"
        >
          Create Account
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;