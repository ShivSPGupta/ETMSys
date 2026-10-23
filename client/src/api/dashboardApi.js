import api from "./axios.js";

export const dashboardApi = {
  get: () => api.get("/dashboard").then(({ data }) => data),
};
