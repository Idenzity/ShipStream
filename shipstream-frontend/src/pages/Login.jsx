function Login() {
  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Welcome back</h1>

        <p>
          Log in to your ShipStream account.
        </p>

        <form>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit">
            Login
          </button>

        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <a href="/register">
            Create one
          </a>
        </p>

      </div>

    </div>
  );
}

export default Login;