// Logout.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/logout", {
      method: "POST",
      credentials: "include", // important pour inclure les cookies de session
    })
      .then((res) => {
        if (res.ok) {
          localStorage.removeItem("user");
          navigate("/", { replace: true });
        } else {
            navigate("/", { replace: true });
        }
      })
      .catch((error) => {
        console.error("Erreur réseau :", error);
      });
  }, [navigate]);

  return null;
};

export default Logout;
