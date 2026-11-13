const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/+$/, "");

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "The request could not be completed.");
    error.status = response.status;
    throw error;
  }

  return data;
}
