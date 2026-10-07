import "./index.css";

function App() {
  return (
    <div className="app">

      <nav className="navbar">
        <div className="logo">
          ShipStream
        </div>

        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#">Track Delivery</a>
          <a href="#">Login</a>
        </div>
      </nav>


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
            <button className="primary-button">
              Track a Delivery
            </button>

            <button className="secondary-button">
              Create Account
            </button>
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

export default App;