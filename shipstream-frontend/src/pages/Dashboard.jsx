import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div className="dashboard">

      <div className="dashboard-header">

        <div>
          <p className="eyebrow">
            SHIPSTREAM DASHBOARD
          </p>

          <h1>
            Welcome back!
          </h1>

          <p>
            Here's an overview of your furniture deliveries.
          </p>
        </div>

        <Link
          to="/shipments"
          className="primary-button"
        >
          View Shipments
        </Link>

      </div>


      <div className="stats">

        <div className="stat-card">
          <h3>3</h3>
          <p>Active Deliveries</p>
        </div>

        <div className="stat-card">
          <h3>2</h3>
          <p>In Transit</p>
        </div>

        <div className="stat-card">
          <h3>1</h3>
          <p>Delivered</p>
        </div>

      </div>


      <div className="recent-section">

        <h2>Recent Deliveries</h2>

        <div className="shipment-card">

          <div>
            <h3>Oak Dining Table</h3>

            <p>
              Tracking: SS123456789
            </p>
          </div>

          <span className="status">
            In Transit
          </span>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;