import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createShipment,
  deleteShipment,
  getShipments,
  registerTracking,
  advanceMockTracking,
} from "../api/shipments";

function Shipments() {
  const [shipments, setShipments] = useState([]);

  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const isBusiness =
    subscription?.plan?.toLowerCase() === "business" &&
    subscription?.status?.toLowerCase() === "active";
    
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    furnitureName: "",
    description: "",
    recipientName: "",
    deliveryAddress: "",
    carrier: "",
    trackingNumber: "",
    estimatedDelivery: "",
  });

  const loadShipments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getShipments();
      setShipments(data.shipments || []);
    } catch (err) {
      setError(err.message || "Unable to load shipments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL ||
          (import.meta.env.DEV ? "http://localhost:5000" : "");

        const response = await fetch(
          `${API_URL}/api/billing/subscription`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load subscription."
          );
        }

        setSubscription(data.subscription);
      } catch (err) {
        console.error("Subscription loading error:", err);
        setSubscription(null);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    loadSubscription();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await createShipment(formData);

      setFormData({
        furnitureName: "",
        description: "",
        recipientName: "",
        deliveryAddress: "",
        carrier: "",
        trackingNumber: "",
        estimatedDelivery: "",
      });

      setShowForm(false);
      setSuccess("Furniture delivery added successfully.");

      await loadShipments();
    } catch (err) {
      setError(err.message || "Unable to create shipment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this shipment?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteShipment(id);

      setShipments((previous) =>
        previous.filter((shipment) => shipment.id !== id)
      );

      setSuccess("Shipment deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete shipment.");
    }
  };

  const handleRegisterTracking = async (shipment) => {
    setError("");
    setSuccess("");

    try {
      const result = await registerTracking(shipment.id);

      setSuccess(result.message);
      await loadShipments();
    } catch (err) {
      setError(err.message || "Unable to register tracking.");
    }
  };

  
const handleMockAdvance = async (shipment) => {
  setError("");
  setSuccess("");

  try {
    const result = await advanceMockTracking(shipment.id);

    setSuccess(result.message);
    await loadShipments();
  } catch (err) {
    setError(err.message || "Unable to simulate tracking.");
  }
};

  return (
    <main className="shipments-page">
      <div className="shipments-header">
        <div>
          <h1>My Deliveries</h1>
          <p>Manage and track your furniture shipments.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setShowForm((previous) => !previous);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Cancel" : "+ Add Delivery"}
        </button>
      </div>

      {error && (
        <p className="notice error-message" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="notice success-message" role="status">
          {success}
        </p>
      )}

      {showForm && (
        <section className="shipment-form-card">
          <h2>Add a Furniture Delivery</h2>

          <form onSubmit={handleSubmit} className="shipment-form">
            <div className="form-group">
              <label htmlFor="furnitureName">Furniture Name *</label>
              <input
                id="furnitureName"
                name="furnitureName"
                value={formData.furnitureName}
                onChange={handleChange}
                maxLength={150}
                required
                placeholder="e.g. Wooden dining table"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={1000}
                rows={3}
                placeholder="Color, dimensions, or other details"
              />
            </div>

            <div className="form-group">
              <label htmlFor="recipientName">Recipient Name *</label>
              <input
                id="recipientName"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleChange}
                maxLength={150}
                required
                placeholder="Person receiving the delivery"
              />
            </div>

            <div className="form-group">
              <label htmlFor="deliveryAddress">Delivery Address *</label>
              <textarea
                id="deliveryAddress"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleChange}
                maxLength={500}
                rows={3}
                required
                placeholder="Complete delivery address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="carrier">Carrier</label>
              <input
                id="carrier"
                name="carrier"
                value={formData.carrier}
                onChange={handleChange}
                maxLength={100}
                placeholder="e.g. Assigned later"
              />
            </div>

            <div className="form-group">
              <label htmlFor="trackingNumber">Tracking Number</label>
              <input
                id="trackingNumber"
                name="trackingNumber"
                value={formData.trackingNumber}
                onChange={handleChange}
                maxLength={150}
                placeholder="Optional tracking number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="estimatedDelivery">
                Estimated Delivery
              </label>
              <input
                id="estimatedDelivery"
                name="estimatedDelivery"
                type="date"
                value={formData.estimatedDelivery}
                onChange={handleChange}
              />
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Delivery"}
            </button>
          </form>
        </section>
      )}

      <section className="shipments-list">
        {loading ? (
          <p>Loading your deliveries...</p>
        ) : shipments.length === 0 ? (
          <div className="empty-state">
            <h2>No deliveries yet</h2>
            <p>Add a furniture delivery to get started.</p>
          </div>
        ) : (
          shipments.map((shipment) => (
            <article className="shipment-card" key={shipment.id}>
              <div className="shipment-card-header">
                <div>
                  <h2>{shipment.furniture_name}</h2>
                  <p>Recipient: {shipment.recipient_name}</p>
                </div>

                <span className="shipment-status">
                  {shipment.status}
                </span>
              </div>

              <p>
                <strong>Carrier:</strong>{" "}
                {shipment.carrier || "Not assigned"}
              </p>

              <p>
                <strong>Tracking number:</strong>{" "}
                {shipment.tracking_number || "Not available"}
              </p>

              <p>
                <strong>Estimated delivery:</strong>{" "}
                {shipment.estimated_delivery
                  ? new Date(
                      `${shipment.estimated_delivery}T00:00:00`
                    ).toLocaleDateString()
                  : "Not available"}
              </p>

              
              <div className="shipment-actions">
                <Link
                  to={`/shipments/${shipment.id}`}
                  className="secondary-button"
                >
                  View Details
                </Link>

                {isBusiness && shipment.tracking_number && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleRegisterTracking(shipment)}
                    disabled={subscriptionLoading}
                  >
                    Register with 17TRACK
                  </button>
                )}

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleMockAdvance(shipment)}
                >
                  Simulate Next Tracking Status
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(shipment.id)}
                >
                  Delete
                </button>
              </div>

            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default Shipments;