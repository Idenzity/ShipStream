import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

function Billing() {
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBillingData() {
      try {
        setLoading(true);
        setError("");

        const [subscriptionResponse, paymentsResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/billing/subscription`, {
              credentials: "include",
            }),
            fetch(`${API_URL}/api/billing/payments`, {
              credentials: "include",
            }),
          ]);

        const subscriptionData = await subscriptionResponse.json();
        const paymentsData = await paymentsResponse.json();

        if (
          !subscriptionResponse.ok ||
          !paymentsResponse.ok
        ) {
          throw new Error(
            subscriptionData.message ||
              paymentsData.message ||
              "Unable to load billing information."
          );
        }

        if (!cancelled) {
          setSubscription(subscriptionData.subscription);
          setPayments(paymentsData.payments || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load billing information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBillingData();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (date) => {
    if (!date) return "Not applicable";

    return new Date(date).toLocaleDateString();
  };

  const formatPlan = (plan) => {
    if (!plan) return "Free";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <main className="billing-page">
        <p>Loading your billing information...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="billing-page">
        <h1>Billing & Subscription</h1>
        <p role="alert">{error}</p>
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

  const plan = formatPlan(subscription?.plan);

  const isActiveBusiness =
  subscription?.plan?.toLowerCase() === "business" &&
  subscription?.status?.toLowerCase() === "active";

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
            <h2>{plan}</h2>
          </div>

          <span className="billing-status">
            {formatStatus(subscription?.status)}
          </span>
        </div>

        <p className="billing-description">
          {subscription?.plan === "business"
            ? "Your ShipStream Business subscription."
            : "You are using the free ShipStream plan."}
        </p>

        <div className="billing-details">
          <div>
            <span>Start date</span>
            <strong>{formatDate(subscription?.started_at)}</strong>
          </div>

          <div>
            <span>Expiration date</span>
            <strong>{formatDate(subscription?.ends_at)}</strong>
          </div>
        </div>

        {!isActiveBusiness && (
          <button
            type="button"
            className="billing-primary-button"
            onClick={() => navigate("/plans")}
          >
            Upgrade Plan
          </button>
        )}
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
                      {payment.currency === "PHP" ? "₱" : ""}
                      {(payment.amount / 100).toFixed(2)}
                    </td>
                    <td>{formatStatus(payment.status)}</td>
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