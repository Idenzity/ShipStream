import { Link } from "react-router-dom";

function Shipments() {

  const shipments = [
    {
      id: 1,
      name: "Oak Dining Table",
      tracking: "SS123456789",
      status: "In Transit"
    },
    {
      id: 2,
      name: "Modern Sofa",
      tracking: "SS987654321",
      status: "Out for Delivery"
    },
    {
      id: 3,
      name: "Office Desk",
      tracking: "SS456789123",
      status: "Delivered"
    }
  ];

  return (
    <div className="dashboard">

      <div className="dashboard-header">

        <div>
          <p className="eyebrow">
            MY DELIVERIES
          </p>

          <h1>
            Shipments
          </h1>

          <p>
            View and manage your furniture deliveries.
          </p>
        </div>

      </div>


      <div className="shipment-grid">

        {shipments.map((shipment) => (

          <div
            className="shipment-card"
            key={shipment.id}
          >

            <h3>
              {shipment.name}
            </h3>

            <p>
              Tracking: {shipment.tracking}
            </p>

            <span className="status">
              {shipment.status}
            </span>

            <br />

            <Link
              to={`/shipments/${shipment.id}`}
              className="view-button"
            >
              View Details
            </Link>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Shipments;