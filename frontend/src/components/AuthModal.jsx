import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { X, Lock, Mail, User, Sparkles, AlertCircle, ShieldCheck, Clock, AtSign } from "lucide-react";

const AuthModal = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const {
    login,
    register,
    authModalOpen,
    closeAuthModal,
    authModalMode,
    authModalMessage,
    setAuthModalMode
  } = useAuth();

  const isOpen = propIsOpen !== undefined ? propIsOpen : authModalOpen;
  const onClose = propOnClose || closeAuthModal;

  const [isLoginView, setIsLoginView] = useState(authModalMode !== "register");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsLoginView(authModalMode !== "register");
    setError("");
    setNotice("");
  }, [authModalMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (isLoginView) {
        await login(email, password);
        onClose();
      } else {
        const res = await register(name, username, email, password);
        if (res?.pendingApproval) {
          setNotice(res.message || "Your registration was successful and is pending administrator approval before you can sign in.");
          setIsLoginView(true);
          setPassword("");
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    const nextMode = isLoginView ? "register" : "login";
    setIsLoginView(!isLoginView);
    if (setAuthModalMode) setAuthModalMode(nextMode);
    setError("");
    setNotice("");
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(5, 8, 16, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg-card, #111827)",
          borderRadius: "16px",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px var(--g-accent, rgba(99, 102, 241, 0.2))",
          padding: "32px",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "none",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted, #94a3b8)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          title="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "var(--accent-gradient, var(--accent-gradient, linear-gradient(135deg, #6366f1, #3b82f6)))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 4px 15px var(--g-accent, rgba(99, 102, 241, 0.4))"
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text-heading, #ffffff)" }}>
              {isLoginView ? "Sign In to Continue" : "Create Free Account"}
            </h3>
          </div>
        </div>

        {/* Dynamic Context Message */}
        {authModalMessage && (
          <div style={{
            background: "var(--g-accent, rgba(99, 102, 241, 0.12))",
            border: "1px solid var(--g-accent, rgba(99, 102, 241, 0.28))",
            borderRadius: "10px",
            padding: "10px 14px",
            color: "#c7d2fe",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px"
          }}>
            <ShieldCheck size={18} style={{ flexShrink: 0, color: "#818cf8" }} />
            <span>{authModalMessage}</span>
          </div>
        )}

        {/* Info / Pending Approval Notice */}
        {notice && (
          <div style={{
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "10px",
            padding: "12px 14px",
            color: "#fbbf24",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            marginBottom: "18px",
            lineHeight: 1.4
          }}>
            <Clock size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{notice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "10px",
            padding: "10px 14px",
            color: "#f87171",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "18px"
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary, #cbd5e1)" }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={iconInputStyle} />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="form-input"
                    style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", color: "#fff" }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary, #cbd5e1)" }}>
                  Username
                </label>
                <div style={{ position: "relative" }}>
                  <AtSign size={16} style={iconInputStyle} />
                  <input
                    type="text"
                    required
                    placeholder="johndoe"
                    className="form-input"
                    style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", color: "#fff" }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    autoComplete="username"
                  />
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", display: "block" }}>
                  Used for sign in. Letters, numbers, hyphens, dots & underscores only.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary, #cbd5e1)" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={iconInputStyle} />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    className="form-input"
                    style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", color: "#fff" }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {isLoginView && (
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary, #cbd5e1)" }}>
                Username or Email Address
              </label>
              <div style={{ position: "relative" }}>
                <User size={16} style={iconInputStyle} />
                <input
                  type="text"
                  required
                  placeholder="Enter username or email address"
                  className="form-input"
                  style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", color: "#fff" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: isLoginView ? "16px" : "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="form-label" style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary, #cbd5e1)" }}>
                Password
              </label>
              {isLoginView && (
                <Link
                  to="/forgot-password"
                  onClick={onClose}
                  style={{
                    fontSize: "0.8rem",
                    color: "#38bdf8",
                    textDecoration: "none",
                    fontWeight: 500
                  }}
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={iconInputStyle} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="form-input"
                style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", color: "#fff" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="button button-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px 18px", fontSize: "0.95rem", fontWeight: 700 }}
            disabled={loading}
          >
            {loading
              ? "Authenticating..."
              : isLoginView
              ? "Sign In"
              : "Create Free Account"}
          </button>
        </form>

        {/* View Switcher */}
        <div style={{
          marginTop: "20px",
          textAlign: "center",
          fontSize: "0.88rem",
          color: "var(--text-muted, #94a3b8)"
        }}>
          {isLoginView ? "Don't have an account yet? " : "Already have an account? "}
          <button
            type="button"
            onClick={handleToggleMode}
            style={{
              background: "none",
              border: "none",
              color: "var(--g-accent, #6366f1)",
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0
            }}
          >
            {isLoginView ? "Register for free" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

const iconInputStyle = {
  position: "absolute",
  left: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "var(--text-dim, #64748b)"
};

export default AuthModal;
