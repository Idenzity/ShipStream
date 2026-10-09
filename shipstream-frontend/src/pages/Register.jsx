import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
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


    if (!formData.fullName.trim()) {
      newErrors.fullName =
        "Full name is required.";
    }


    if (!formData.email) {
      newErrors.email =
        "Email is required.";
    }
    else if (!formData.email.includes("@")) {
      newErrors.email =
        "Please enter a valid email.";
    }


    if (!formData.phone.trim()) {
      newErrors.phone =
        "Phone number is required.";
    }


    if (!formData.password) {
      newErrors.password =
        "Password is required.";
    }
    else if (formData.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters.";
    }


    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    }
    else if (
      formData.password !==
      formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }


    return newErrors;
  };


  const handleSubmit = (event) => {

    event.preventDefault();

    const validationErrors =
      validateForm();

    setErrors(validationErrors);


    if (
      Object.keys(validationErrors).length === 0
    ) {

      console.log(
        "Registration form submitted:",
        formData
      );

      alert(
        "Registration form is valid!"
      );

    }

  };


  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Create an account</h1>

        <p>
          Create your ShipStream account.
        </p>


        <form onSubmit={handleSubmit}>


          <div className="form-group">

            <label htmlFor="fullName">
              Full Name
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />

            {errors.fullName && (
              <p className="error-message">
                {errors.fullName}
              </p>
            )}

          </div>


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

            <label htmlFor="phone">
              Phone Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />

            {errors.phone && (
              <p className="error-message">
                {errors.phone}
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
              placeholder="Create a password"
            />

            {errors.password && (
              <p className="error-message">
                {errors.password}
              </p>
            )}

          </div>


          <div className="form-group">

            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />

            {errors.confirmPassword && (
              <p className="error-message">
                {errors.confirmPassword}
              </p>
            )}

          </div>


          <button type="submit">
            Create Account
          </button>

        </form>


        <p className="auth-footer">

          Already have an account?{" "}

          <Link to="/login">
            Login
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Register;