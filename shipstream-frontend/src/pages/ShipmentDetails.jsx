import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getShipment } from "../api/shipments";

function ShipmentDetails() {
  const { id } = useParams();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          {shipment.carrier || "Not assigned"}
        </p>

        <p>
          <strong>Tracking number:</strong>{" "}
          {shipment.tracking_number || "Not available"}
        </p>

        <p>
          <strong>Estimated delivery:</strong>{" "}
          {shipment.estimated_delivery || "Not available"}
        </p>

        <p>
          <strong>Created:</strong>{" "}
          {new Date(shipment.created_at).toLocaleString()}
        </p>
      </section>
    </main>
  );
}

export default ShipmentDetails;
