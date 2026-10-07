import { useParams } from "react-router-dom";

function ShipmentDetails() {

  const { id } = useParams();

  return (
    <div className="dashboard">

      <p className="eyebrow">
        SHIPMENT DETAILS
      </p>

      <h1>
        Oak Dining Table
      </h1>

      <p>
        Shipment ID: {id}
      </p>


      <div className="shipment-details">

        <h2>
          Delivery Status
        </h2>

        <div className="timeline">

          <div className="timeline-item">
            <strong>Order Created</strong>
            <p>Your delivery order was created.</p>
          </div>

          <div className="timeline-item">
            <strong>Picked Up</strong>
            <p>The furniture has been picked up.</p>
          </div>

          <div className="timeline-item">
            <strong>In Transit</strong>
            <p>Your furniture is currently in transit.</p>
          </div>

          <div className="timeline-item inactive">
            <strong>Delivered</strong>
            <p>Your furniture has not been delivered yet.</p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default ShipmentDetails;