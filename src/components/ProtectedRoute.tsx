// components/ProtectedRoute.tsx
import type { JSX } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = !!localStorage.getItem("user"); // ou sessionStorage
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
