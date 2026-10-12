import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Synchronously initialize token from localStorage
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("cms_token") || null;
    } catch (e) {
      return null;
    }
  });

  // Synchronously initialize user from localStorage with JWT fallback
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("cms_user");
      if (stored) return JSON.parse(stored);

      const t = localStorage.getItem("cms_token");
      if (t && t.includes(".")) {
        const payload = JSON.parse(atob(t.split(".")[1]));
        return {
          _id: payload.id || payload._id || "user",
          name: payload.name || "User",
          email: payload.email || "",
          role: payload.role || "user"
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Global Auth Modal State for Protected Content Access
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login"); // "login" | "register"
  const [authModalMessage, setAuthModalMessage] = useState("");
  const [pendingRedirect, setPendingRedirect] = useState(null);

  // Background session verification without blocking UI
  useEffect(() => {
    const storedToken = localStorage.getItem("cms_token");
    if (storedToken) {
      authAPI.getMe()
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem("cms_user", JSON.stringify(res.user));
          }
        })
        .catch((err) => {
          console.warn("Background session check error:", err.message);
          if (err.message && (err.message.includes("401") || err.message.includes("expired") || err.message.includes("denied"))) {
            logout();
          }
        });
    }
  }, []);

  const openAuthModal = useCallback((mode = "login", message = "", redirectUrl = null) => {
    setAuthModalMode(mode);
    setAuthModalMessage(message || (mode === "register" ? "Create a free account to continue" : "Please sign in or register to continue"));
    if (redirectUrl) setPendingRedirect(redirectUrl);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthModalMessage("");
    setPendingRedirect(null);
  }, []);

  const login = async (loginIdentifier, password) => {
    const res = await authAPI.login({
      loginIdentifier,
      email: loginIdentifier,
      username: loginIdentifier,
      password
    });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("cms_token", res.token);
      localStorage.setItem("cms_user", JSON.stringify(res.user));
      setAuthModalOpen(false);
      const target = pendingRedirect;
      setPendingRedirect(null);
      if (target && target !== "/") {
        window.location.href = target;
      }
    }
    return res;
  };

  const register = async (name, usernameOrEmail, emailOrPassword, maybePassword) => {
    let nameVal = name;
    let usernameVal = '';
    let emailVal = '';
    let passwordVal = '';

    if (maybePassword !== undefined) {
      // 4 arguments: (name, username, email, password)
      usernameVal = usernameOrEmail;
      emailVal = emailOrPassword;
      passwordVal = maybePassword;
    } else {
      // 3 arguments (legacy): (name, email, password)
      emailVal = usernameOrEmail;
      passwordVal = emailOrPassword;
      usernameVal = (emailVal || '').split('@')[0];
    }

    const res = await authAPI.register({
      name: nameVal,
      username: usernameVal,
      email: emailVal,
      password: passwordVal
    });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("cms_token", res.token);
      localStorage.setItem("cms_user", JSON.stringify(res.user));
      setAuthModalOpen(false);
      const target = pendingRedirect;
      setPendingRedirect(null);
      if (target && target !== "/") {
        window.location.href = target;
      }
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("cms_token");
    localStorage.removeItem("cms_user");
  };

  // User is authenticated whenever a valid token exists
  const isAuthenticated = Boolean(token);
  const isAdmin = user?.role === "admin";
  const isEditor = ["admin", "editor"].includes(user?.role);

  // Helper function to guard any click or navigation
  const requireAuth = useCallback((callback, message = "Please sign in or register to access this content", redirectUrl = null) => {
    if (token) {
      if (typeof callback === "function") callback();
    } else {
      openAuthModal("login", message, redirectUrl);
    }
  }, [token, openAuthModal]);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      try {
        localStorage.setItem("cms_user", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isEditor,
        isAuthenticated,
        // Modal helpers
        authModalOpen,
        authModalMode,
        authModalMessage,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        requireAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
