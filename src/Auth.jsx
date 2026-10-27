
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sparkles, ArrowLeft } from "lucide-react";
import api from "./api";
import "./Auth.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from || "/";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup ? "/auth/register" : "/auth/login";

      const payload = isSignup
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await api.post(endpoint, payload);
      const token = response.data.token;

      if (!token) {
        throw new Error("The server did not return a login token.");
      }

      localStorage.setItem("tasbih-token", token);
      localStorage.setItem("tasbih-user", JSON.stringify(response.data.user));

      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow" />

      <Link to="/" className="auth-back">
        <ArrowLeft size={17} />
        Back to Tasbih Counter
      </Link>

      <section className="auth-card">
        <div className="auth-emblem">۞</div>

        <div className="auth-eyebrow">
          <Sparkles size={14} />
          YOUR MOMENT OF PEACE
        </div>

        <h1>
          {isSignup ? "Begin your journey." : "Welcome back."}
        </h1>

        <p className="auth-subtitle">
          {isSignup
            ? "Create an account for your Dhikr journey."
            : "Sign in to continue to your daily Dhikr."}
        </p>

        {location.state?.loginFirst && (
          <div className="auth-notice">
            Please log in first to open your Daily Dhikr.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <label>
              Full name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
                maxLength={80}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create Account"
                : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to Tasbih?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
          >
            {isSignup ? "Log in" : "Create account"}
          </button>
        </p>

        <div className="auth-footer">
          <Moon size={15} />
          Made with intention, for remembrance.
        </div>
      </section>
    </main>
  );
}
