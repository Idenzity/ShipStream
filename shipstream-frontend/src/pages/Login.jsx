import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value
    });

  };

  const validateForm = () => {

    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required.";
    }
    else if (!formData.email.includes("@")) {
      newErrors.email = "Please enter a valid email.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    return newErrors;
  };

const handleSubmit = async (event) => {
  event.preventDefault();

  setServerError("");

  const validationErrors = validateForm();
  setErrors(validationErrors);

  if (Object.keys(validationErrors).length > 0) {
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed.");
    }

    navigate("/dashboard");
  } catch (error) {
    setServerError(
      error.message || "Unable to connect to the server."
    );
  } finally {
    setIsSubmitting(false);
  }
};

const navigate = useNavigate();

const [serverError, setServerError] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Welcome back</h1>

        <p>
          Log in to your ShipStream account.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />

            {errors.email && (
              <p className="error-message">
                {errors.email}
              </p>
            )}

          </div>

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />

            {errors.password && (
              <p className="error-message">
                {errors.password}
              </p>
            )}

          </div>

          <button type="submit">
            Login
          </button>
          
          {serverError && (
            <p className="error-message" role="alert">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">

          Don't have an account?{" "}

          <Link to="/register">
            Create one
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Login;