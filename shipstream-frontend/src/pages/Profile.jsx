import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubscription() {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000";

        const response = await fetch(
          `${API_URL}/api/billing/subscription`,
          { credentials: "include" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your current plan."
          );
        }

        setSubscription(data.subscription);
      } catch (err) {
        setError(err.message || "Unable to load subscription.");
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, []);

  const planName = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() +
      subscription.plan.slice(1).toLowerCase()
    : "Unavailable";

  return (
    <main className="profile-page">
      <div className="profile-header">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>My Profile</h1>
        <p>View your account information and current plan.</p>
      </div>

      <section className="profile-card">
        <div className="profile-avatar" aria-hidden="true">
          {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <h2>{user?.fullName || "User"}</h2>
        <p className="profile-description">
          Your ShipStream account information
        </p>

        <div className="profile-info">
          <div className="profile-info-item">
            <span>Username</span>
            <strong>{user?.fullName || "Unavailable"}</strong>
          </div>

          <div className="profile-info-item">
            <span>Email Address</span>
            <strong>{user?.email || "Unavailable"}</strong>
          </div>

          <div className="profile-info-item">
            <span>Phone Number</span>
            <strong>{user?.phone || "Not provided"}</strong>
          </div>

          <div className="profile-info-item">
            <span>Current Plan</span>
            {loading ? (
              <strong>Loading...</strong>
            ) : (
              <strong className="profile-plan">{planName}</strong>
            )}
          </div>

          {!loading && subscription && (
            <div className="profile-info-item">
              <span>Subscription Status</span>
              <strong>{subscription.status || "Unavailable"}</strong>
            </div>
          )}
        </div>

        {error && (
          <p className="notice error-message" role="alert">
            {error}
          </p>
        )}

        <div className="profile-actions">
          <Link to="/billing" className="primary-button">
            View Subscriptions
          </Link>

        </div>
      </section>
    </main>
  );
}

export default Profile;