import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function Login() {
  const isRegister = useLocation().pathname === "/register";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiRequest(`/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(
          isRegister ? { name, email, password } : { email, password },
        ),
      });
      navigate("/applications", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur sm:p-9">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight"
          aria-label="TrackMe home"
        >
          Track<span className="text-green-400">Me</span>
        </Link>
        <h1 className="mt-8 text-3xl font-bold">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {isRegister
            ? "Start keeping your next steps organized."
            : "Sign in to continue to your applications."}
        </p>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          {isRegister && (
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="name">
                Name
              </label>
              <input
                autoComplete="name"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 outline-none transition focus:border-green-400"
                id="name"
                maxLength={255}
                onChange={(event) => setName(event.target.value)}
                required
                type="text"
                value={name}
              />
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 outline-none transition focus:border-green-400"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="password"
            >
              Password
            </label>
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 outline-none transition focus:border-green-400"
              id="password"
              minLength={isRegister ? 8 : undefined}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {isRegister && (
              <p className="mt-2 text-xs text-gray-400">
                Use at least 8 characters.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            className="w-full rounded-lg bg-green-400 px-4 py-3 font-bold text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isRegister ? "Already have an account?" : "New to TrackMe?"}{" "}
          <Link
            className="font-semibold text-green-300 hover:text-green-200"
            to={isRegister ? "/login" : "/register"}
          >
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
