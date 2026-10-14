import { useNavigate } from "react-router-dom";

function Billing() {
  const navigate = useNavigate();

  // Temporary display values.
  // We will replace these with Supabase data later.
  const subscription = {
    plan: "Free",
    status: "Active",
    startedAt: null,
    endsAt: null,
  };

  const payments = [];

  const formatDate = (date) => {
    if (!date) return "Not applicable";
    return new Date(date).toLocaleDateString();
  };

  return (
    <main className="billing-page">
      <header className="billing-header">
        <p className="billing-eyebrow">SHIPSTREAM BILLING</p>
        <h1>Billing & Subscription</h1>
        <p>
          Manage your ShipStream plan and review your payment history.
        </p>
      </header>

      <section className="billing-card">
        <div className="billing-card-heading">
          <div>
            <p className="billing-label">CURRENT PLAN</p>
            <h2>{subscription.plan}</h2>
          </div>

          <span className="billing-status">
            {subscription.status}
          </span>
        </div>

        <p className="billing-description">
          {subscription.plan === "Free"
            ? "You are using the free ShipStream plan."
            : "Your ShipStream Business subscription."}
        </p>

        <div className="billing-details">
          <div>
            <span>Start date</span>
            <strong>{formatDate(subscription.startedAt)}</strong>
          </div>

          <div>
            <span>Expiration date</span>
            <strong>{formatDate(subscription.endsAt)}</strong>
          </div>
        </div>

        <button
          type="button"
          className="billing-primary-button"
          onClick={() => navigate("/plans")}
        >
          {subscription.plan === "Free"
            ? "Upgrade Plan"
            : "View Plans"}
        </button>
      </section>

      <section className="billing-card payment-history">
        <h2>Payment History</h2>
        <p className="billing-muted">
          Your ShipStream subscription payments will appear here.
        </p>

        {payments.length === 0 ? (
          <div className="billing-empty">
            <p>No payments yet.</p>
            <span>
              Payments will appear here after you complete a checkout.
            </span>
          </div>
        ) : (
          <div className="billing-table-wrapper">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.created_at)}</td>
                    <td>
                      ₱{(payment.amount / 100).toFixed(2)}
                    </td>
                    <td>{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <button
        type="button"
        className="billing-back-button"
        onClick={() => navigate("/dashboard")}
      >
        Back to Dashboard
      </button>
    </main>
  );
}

export default Billing;