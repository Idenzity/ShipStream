import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getShipment } from "../api/shipments";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "");

function ShipmentDetails() {
  const { id } = useParams();

  const [shipment, setShipment] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingError, setTrackingError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadShipment() {
      setLoading(true);
      setError("");

      try {
        const data = await getShipment(id);

        if (active) {
          setShipment(data.shipment);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load shipment.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadShipment();

    return () => {
      active = false;
    };
  }, [id]);

  async function loadTracking() {
    setTrackingLoading(true);
    setTrackingError("");

    try {
      const response = await fetch(
        `${API_URL}/api/shipments/${id}/tracking`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to retrieve tracking information."
        );
      }

      setTracking(data);
    } catch (err) {
      setTrackingError(
        err.message || "Unable to retrieve tracking information."
      );
    } finally {
      setTrackingLoading(false);
    }
  }

  useEffect(() => {
    if (shipment?.tracking_number) {
      loadTracking();
    }
  }, [shipment?.id, shipment?.tracking_number]);

  if (loading) {
    return <main className="details-page">Loading shipment...</main>;
  }

  if (error) {
    return (
      <main className="details-page">
        <p className="error-message">{error}</p>
        <Link to="/shipments" className="secondary-button">
          Back to Deliveries
        </Link>
      </main>
    );
  }

  if (!shipment) {
    return (
      <main className="details-page">
        <p>Shipment not found.</p>
        <Link to="/shipments">Back to Deliveries</Link>
      </main>
    );
  }

  const estimatedDelivery =
    tracking?.estimatedDelivery?.to ||
    tracking?.estimatedDelivery?.from ||
    shipment.estimated_delivery;

  return (
    <main className="details-page">
      <Link to="/shipments" className="back-link">
        &larr; Back to Deliveries
      </Link>

      <section className="shipment-details-card">
        <h1>{shipment.furniture_name}</h1>

        <span className="shipment-status">
          {shipment.status}
        </span>

        <h2>Delivery Information</h2>

        <p>
          <strong>Recipient:</strong> {shipment.recipient_name}
        </p>

        <p>
          <strong>Address:</strong> {shipment.delivery_address}
        </p>

        <p>
          <strong>Description:</strong>{" "}
          {shipment.description || "No description provided"}
        </p>

        <h2>Tracking Information</h2>

        <p>
          <strong>Carrier:</strong>{" "}
          {tracking?.carrier || shipment.carrier || "Not assigned"}
        </p>

        <p>
          <strong>Tracking number:</strong>{" "}
          {shipment.tracking_number || "Not available"}
        </p>

        <p>
          <strong>Estimated delivery:</strong>{" "}
          {estimatedDelivery
            ? new Date(estimatedDelivery).toLocaleDateString()
            : "Not available"}
        </p>

        <h2>Live Tracking Updates</h2>

        {trackingLoading && <p>Loading tracking updates...</p>}

        {trackingError && (
          <div>
            <p className="error-message">{trackingError}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={loadTracking}
              disabled={trackingLoading}
            >
              Retry Tracking
            </button>
          </div>
        )}

        {tracking && (
          <div className="tracking-updates">
            <p>
              <strong>17TRACK status:</strong>{" "}
              {tracking.status || "Awaiting updates"}
            </p>

            {tracking.subStatus && (
              <p>
                <strong>Details:</strong> {tracking.subStatus}
              </p>
            )}

            {tracking.latestEvent ? (
              <>
                <p>
                  <strong>Latest event:</strong>{" "}
                  {tracking.latestEvent.description}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {tracking.latestEvent.location || "Not provided"}
                </p>

                <p>
                  <strong>Event time:</strong>{" "}
                  {tracking.latestEvent.time
                    ? new Date(
                        tracking.latestEvent.time
                      ).toLocaleString()
                    : "Not provided"}
                </p>
              </>
            ) : (
              <p>
                No tracking events are available yet. Check again after
                the courier has updated the shipment.
              </p>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={loadTracking}
              disabled={trackingLoading}
            >
              Refresh Tracking
            </button>
          </div>
        )}

        <p>
          <strong>Created:</strong>{" "}
          {shipment.created_at
            ? new Date(shipment.created_at).toLocaleString()
            : "Not available"}
        </p>
      </section>
    </main>
  );
}

export default ShipmentDetails;