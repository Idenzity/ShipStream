import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "");

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "For small furniture businesses getting started.",
    features: [
      "Up to 10 active shipments",
      "Basic shipment tracking",
      "Shipment status management",
      "Basic dashboard",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 299,
    description: "For furniture businesses managing more deliveries.",
    features: [
      "More active shipments",
      "17TRACK integration where supported",
      "Delivery history",
      "Additional shipment reports",
    ],
  },
];

function Plans() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [subscription, setSubscription] = useState(null);
  
  const isActiveBusiness =
  subscription?.plan?.toLowerCase() === "business" &&
  subscription?.status?.toLowerCase() === "active";

  const handleChoosePlan = async (plan) => {
  if (plan.id === "free") {
    setSelectedPlan("Your Free plan is available.");
    return;
  }

  try {
    setCheckoutLoading(true);
    setCheckoutError("");

    const response = await fetch(
      `${API_URL}/api/billing/checkout`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: plan.id,
        }),
      }
    );

  const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to start checkout."
      );
    }

    if (!data.checkoutUrl) {
      throw new Error("PayMongo did not return a checkout URL.");
    }

    // Redirect to PayMongo's hosted checkout page.
    window.location.href = data.checkoutUrl;
  } catch (error) {
    setCheckoutError(
      error.message || "Unable to start checkout."
    );
    setCheckoutLoading(false);
  }
};


  return (
    <main className="plans-page">
      <header className="plans-header">
        <p className="plans-eyebrow">SHIPSTREAM BILLING</p>
        <h1>Choose Your Plan</h1>
        <p>
          Manage your furniture deliveries with a plan that fits
          your business.
        </p>
      </header>

      <section className="plans-grid">
        {plans.map((plan) => (
          <article
            className={`plan-card ${
              plan.id === "business" ? "featured-plan" : ""
            }`}
            key={plan.id}
          >
            <h2>{plan.name}</h2>

            <div className="plan-price">
              <span>₱</span>
              <strong>{plan.price}</strong>
              {plan.price > 0 && <small>/ 30 days</small>}
            </div>

            <p className="plan-description">{plan.description}</p>

            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {!isActiveBusiness && (
              <button
                type="button"
                className="plan-button primary-plan-button"
                onClick={() => {
                  if (plan.id === "free") {
                    navigate("/");
                  } else {
                    handleChoosePlan(plan);
                  }
                }}
                disabled={checkoutLoading}
              >
                {checkoutLoading && plan.id === "business"
                  ? "Connecting to PayMongo..."
                  : plan.id === "free"
                    ? "Choose Free"
                    : "Upgrade to Business"}
              </button>
            )}
          </article>
        ))}
      </section>

      {selectedPlan && (
        <p className="plans-message" role="status">
          {selectedPlan}
        </p>
      )}

      {checkoutError && (
        <p className="plans-message" role="alert">
          {checkoutError}
        </p>
      )}

    </main>
  );
}

export default Plans;