const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "");
  
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export function getShipments() {
  return request("/api/shipments");
}

export function getShipment(id) {
  return request(`/api/shipments/${encodeURIComponent(id)}`);
}

export function createShipment(shipment) {
  return request("/api/shipments", {
    method: "POST",
    body: JSON.stringify(shipment),
  });
}

export function deleteShipment(id) {
  return request(`/api/shipments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function registerTracking(id) {
  return request(
    `/api/shipments/${encodeURIComponent(id)}/register-tracking`,
    {
      method: "POST",
    }
  );
}

export function advanceMockTracking(id) {
  return request(
    `/api/shipments/${encodeURIComponent(id)}/mock-advance`,
    {
      method: "POST"
    }
  );
}
