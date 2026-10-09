import { useState } from "react";
import { Link } from "react-router-dom";

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

  const handleSubmit = (event) => {

    event.preventDefault();

    const validationErrors = validateForm();

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {

      console.log("Login form submitted:", formData);

      alert("Login form is valid!");

    }

  };

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