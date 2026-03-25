import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  completeCasLogin: (userData) => {},
  logout: () => {},
  reLogin: () => false,
});

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  function reLogin() {
    if (typeof window === "undefined") return false;
    try {
      const stored = window.sessionStorage.getItem("lastUser");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          setUser(parsed);
          setIsAuthenticated(true);
          return true;
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  }

function completeCasLogin(userData) {
  if (userData && userData.token) {
    window.sessionStorage.setItem("lastUser", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    
    setTimeout(() => {
      router.push("/").catch(() => {
        window.location.href = "/";
      });
    }, 100);
  }
}

  async function logout() {
    window.sessionStorage.removeItem("lastUser");
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = "/login";
  }

  useEffect(() => {
    reLogin();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, completeCasLogin, logout, reLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

const ProtectRoute = ({ children }) => {
  const { isAuthenticated, reLogin } = useAuthentification();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
  const isAuth = isAuthenticated || reLogin();
  const path = router.pathname;

  if (!isAuth && path !== "/login" && path !== "/partenaires") {
    router.push("/login");
  } else {
    setIsLoaded(true); // ← retire le else if, laisse toujours render
    if (isAuth && (path === "/login" || path === "/partenaires")) {
      router.push("/");
    }
  }
}, [isAuthenticated, router.pathname]);

  return (isLoaded || router.pathname === "/login") ? children : null;
};

const useAuthentification = () => useContext(AuthContext);
export { AuthProvider, useAuthentification, ProtectRoute };