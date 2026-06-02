const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function buildHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: buildHeaders(token),
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || "Request failed");
  }

  return payload;
}

export const api = {
  login: (body) => request("/auth/login", { method: "POST", body }),
  getQuizzes: (token) => request("/quizzes", { token }),
  getQuiz: (quizId, token) => request(`/quizzes/${quizId}`, { token }),
  createRoom: (body, token) => request("/rooms", { method: "POST", body, token }),
  getRoom: (code) => request(`/rooms/${code}`),
  updateRoomSettings: (code, body, token) =>
    request(`/rooms/${code}/settings`, { method: "PATCH", body, token }),
  startRoom: (code, token) => request(`/rooms/${code}/start`, { method: "POST", token }),
  finishRoom: (code, token) => request(`/rooms/${code}/finish`, { method: "POST", token }),
  joinRoom: (code, body) => request(`/rooms/${code}/join`, { method: "POST", body }),
  updateParticipantName: (code, participantId, body) =>
    request(`/rooms/${code}/participants/${participantId}`, { method: "PATCH", body }),
  getParticipants: (code) => request(`/rooms/${code}/participants`),
  getRoomQuiz: (code) => request(`/rooms/${code}/quiz`),
  submitAnswers: (code, body) => request(`/rooms/${code}/submit`, { method: "POST", body }),
  getResult: (code, participantId) => request(`/rooms/${code}/result/${participantId}`)
};
