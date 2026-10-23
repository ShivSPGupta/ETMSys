import api from "./axios.js";

export const taskApi = {
  list: (params = {}) => api.get("/tasks", { params }).then(({ data }) => data),
  get: (id) => api.get(`/tasks/${id}`).then(({ data }) => data.data),
  create: (task) => api.post("/tasks", task).then(({ data }) => data.data),
  update: (id, task) =>
    api.put(`/tasks/${id}`, task).then(({ data }) => data.data),
  updateStatus: (id, status) =>
    api.put(`/tasks/${id}/status`, { status }).then(({ data }) => data.data),
  remove: (id) => api.delete(`/tasks/${id}`).then(({ data }) => data),
  export: (params = {}) =>
    api
      .get("/tasks/export", { params, responseType: "blob" })
      .then(({ data }) => data),
};
