import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const handleChoosePlan = (plan) => {
    if (plan.id === "free") {
      setSelectedPlan("Your Free plan is available.");
      return;
    }

    navigate("/billing", {
      state: { selectedPlan: plan.id },
    });
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
            {plan.id === "business" && (
              <span className="plan-badge">BUSINESS PLAN</span>
            )}

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

            <button
              type="button"
              className={
                plan.id === "business"
                  ? "plan-button primary-plan-button"
                  : "plan-button"
              }
              onClick={() => handleChoosePlan(plan)}
            >
              {plan.id === "business"
                ? "Upgrade to Business"
                : "Use Free Plan"}
            </button>
          </article>
        ))}
      </section>

      {selectedPlan && (
        <p className="plans-message" role="status">
          {selectedPlan}
        </p>
      )}

      <button
        type="button"
        className="plans-back-button"
        onClick={() => navigate("/dashboard")}
      >
        Back to Dashboard
      </button>
    </main>
  );
}

export default Plans;