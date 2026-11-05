import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sparkles, ArrowLeft } from "lucide-react";
import api from "./api";
import "./Auth.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from || "/";

  function clearMessages() {
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();
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
      localStorage.setItem(
        "tasbih-user",
        JSON.stringify(response.data.user)
      );

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

  async function handleForgotPassword(event) {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setMessage(response.data.message);
      setMode("otp");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const response = await api.post("/auth/verify-otp", {
        email: email.trim(),
        otp: otp.trim(),
      });

      setResetToken(response.data.resetToken);
      setMessage("OTP verified successfully!");
      setMode("reset");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    clearMessages();

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        email: email.trim(),
        resetToken,
        newPassword,
      });

      setMessage(
        response.data.message || "Password reset successfully!"
      );

      setPassword("");
      setNewPassword("");
      setOtp("");
      setResetToken("");

      setMode("login");
      setIsSignup(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    setMode("login");
    setIsSignup(false);
    setOtp("");
    setNewPassword("");
    setResetToken("");
    clearMessages();
  }

  const isPasswordReset = mode === "forgot" ||
    mode === "otp" ||
    mode === "reset";

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
          {mode === "forgot" && "Forgot password?"}
          {mode === "otp" && "Verify your email."}
          {mode === "reset" && "New password."}
          {mode === "login" && !isSignup && "Welcome back."}
          {mode === "login" && isSignup && "Begin your journey."}
        </h1>

        <p className="auth-subtitle">
          {mode === "forgot" &&
            "Enter your registered email to receive a verification code."}

          {mode === "otp" &&
            "Enter the 6-digit verification code sent to your email."}

          {mode === "reset" &&
            "Create a new password for your account."}

          {mode === "login" &&
            (isSignup
              ? "Create an account for your Dhikr journey."
              : "Sign in to continue to your daily Dhikr.")}
        </p>

        {location.state?.loginFirst && mode === "login" && (
          <div className="auth-notice">
            Please log in first to open your Daily Dhikr.
          </div>
        )}

        {message && (
          <p className="auth-success" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {/* LOGIN AND SIGNUP */}
        {mode === "login" && (
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && (
              <label>
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={
                  isSignup ? "new-password" : "current-password"
                }
                minLength={8}
                required
              />
            </label>

            {!isSignup && (
              <div style={{ textAlign: "right", marginTop: "-8px" }}>
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => {
                    setMode("forgot");
                    clearMessages();
                  }}
                >
                  Forgot Password?
                </button>
              </div>
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
        )}

        {/* FORGOT PASSWORD */}
        {mode === "forgot" && (
          <form
            onSubmit={handleForgotPassword}
            className="auth-form"
          >
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* VERIFY OTP */}
        {mode === "otp" && (
          <form
            onSubmit={handleVerifyOtp}
            className="auth-form"
          >
            <label>
              Verification code
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit OTP"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </label>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* RESET PASSWORD */}
        {mode === "reset" && (
          <form
            onSubmit={handleResetPassword}
            className="auth-form"
          >
            <label>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        {mode === "login" && (
          <p className="auth-switch">
            {isSignup
              ? "Already have an account?"
              : "New to Tasbih?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                clearMessages();
              }}
            >
              {isSignup ? "Log in" : "Create account"}
            </button>
          </p>
        )}

        {isPasswordReset && (
          <p className="auth-switch">
            <button type="button" onClick={goToLogin}>
              Back to Login
            </button>
          </p>
        )}

        <div className="auth-footer">
          <Moon size={15} />
          Made with intention, for remembrance.
        </div>
      </section>
    </main>
  );
}