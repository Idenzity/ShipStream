
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getShipments } from "../api/shipments";

function Dashboard() {
  const { user } = useAuth();

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadShipments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getShipments();
      setShipments(data.shipments || []);
    } catch (err) {
      setError(err.message || "Unable to load dashboard deliveries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  const activeDeliveries = shipments.filter(
    (shipment) =>
      !["Delivered", "Cancelled"].includes(shipment.status)
  ).length;

  const inTransit = shipments.filter(
    (shipment) => shipment.status === "In Transit"
  ).length;

  const delivered = shipments.filter(
    (shipment) => shipment.status === "Delivered"
  ).length;

  const recentShipments = [...shipments]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0) -
        new Date(a.created_at || 0)
    )
    .slice(0, 5);

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">SHIPSTREAM DASHBOARD</p>

          <h1>
            Welcome back{user?.fullName ? `, ${user.fullName}` : ""}!
          </h1>

          <p>
            Here's an overview of your furniture deliveries.
          </p>
        </div>

        <Link to="/shipments" className="primary-button">
          View Shipments
        </Link>
      </div>

      {error && (
        <div className="notice error-message" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={loadShipments}
          >
            Try Again
          </button>
        </div>
      )}

      <section className="stats">
        <div className="stat-card">
          <h3>{loading ? "..." : activeDeliveries}</h3>
          <p>Active Deliveries</p>
        </div>

        <div className="stat-card">
          <h3>{loading ? "..." : inTransit}</h3>
          <p>In Transit</p>
        </div>

        <div className="stat-card">
          <h3>{loading ? "..." : delivered}</h3>
          <p>Delivered</p>
        </div>
      </section>

      <section className="recent-section">
        <div className="recent-header">
          <h2>Recent Deliveries</h2>

          <Link to="/shipments" className="back-link">
            View all
          </Link>
        </div>

        {loading ? (
          <p>Loading your deliveries...</p>
        ) : error ? (
          <p>Deliveries could not be loaded.</p>
        ) : recentShipments.length === 0 ? (
          <div className="shipment-card">
            <h3>No deliveries yet</h3>
            <p>Add a furniture delivery to see it on your Dashboard.</p>

            <Link to="/shipments" className="primary-button">
              Add a Delivery
            </Link>
          </div>
        ) : (
          recentShipments.map((shipment) => (
            <article className="shipment-card" key={shipment.id}>
              <div>
                <h3>{shipment.furniture_name}</h3>

                <p>
                  Recipient: {shipment.recipient_name}
                </p>

                <p>
                  Tracking:{" "}
                  {shipment.tracking_number || "Not assigned"}
                </p>
              </div>

              <span className="shipment-status">
                {shipment.status || "Pending"}
              </span>

              <Link
                to={`/shipments/${shipment.id}`}
                className="secondary-button"
              >
                View Details
              </Link>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default Dashboard;