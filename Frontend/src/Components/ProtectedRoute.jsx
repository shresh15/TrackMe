import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../api";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    apiRequest("/auth/me")
      .then(({ user: authenticatedUser }) => {
        if (active) {
          setUser(authenticatedUser);
          setStatus("authenticated");
        }
      })
      .catch((requestError) => {
        if (active) {
          if (requestError.status === 401) {
            setStatus("unauthenticated");
          } else {
            setError(requestError.message);
            setStatus("error");
          }
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-gray-300">
        Checking your session...
      </main>
    );
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-center text-red-200">
        Could not verify your session: {error}
      </main>
    );
  }

  return children({ user });
}

export default ProtectedRoute;
