import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, isLoading } = useAuth();

  // Wait until the login status has been checked.
  if (isLoading) {
    return <div className="home"></div>;
  }

  return (
    <div className="home">
      <main className="hero">
        <div className="hero-content">
          <p className="eyebrow">
            FURNITURE DELIVERY TRACKING
          </p>

          <h1>
            Know where your
            <span> furniture is.</span>
          </h1>

          <p className="description">
            ShipStream helps you track your furniture
            deliveries from pickup to your doorstep.
          </p>

          <div className="hero-buttons">
            {user ? (
              <Link to="/shipments" className="primary-button">
                Track a Delivery
              </Link>
            ) : (
              <Link to="/register" className="secondary-button">
                Create Account
              </Link>
            )}
          </div>
        </div>
      </main>

      <section className="features">
        <div className="feature">
          <h3>Real-Time Tracking</h3>
          <p>
            Keep track of your furniture delivery
            and its current shipping status.
          </p>
        </div>

        <div className="feature">
          <h3>Delivery Updates</h3>
          <p>
            View important updates throughout
            the delivery process.
          </p>
        </div>

        <div className="feature">
          <h3>Easy Management</h3>
          <p>
            Manage your deliveries from one
            simple dashboard.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;