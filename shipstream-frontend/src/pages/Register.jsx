function Register() {
  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Create an account</h1>

        <p>
          Create your ShipStream account.
        </p>

        <form>

          <div className="form-group">
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>

            <input
              type="tel"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Create a password"
            />
          </div>

          <button type="submit">
            Create Account
          </button>

        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <a href="/login">
            Login
          </a>
        </p>

      </div>

    </div>
  );
}

export default Register;