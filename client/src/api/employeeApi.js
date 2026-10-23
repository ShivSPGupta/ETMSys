import api from "./axios.js";

export const employeeApi = {
  list: (params = {}) =>
    api.get("/employees", { params }).then(({ data }) => data),
  get: (id) => api.get(`/employees/${id}`).then(({ data }) => data.data),
  create: (employee) =>
    api.post("/employees", employee).then(({ data }) => data.data),
  update: (id, employee) =>
    api.put(`/employees/${id}`, employee).then(({ data }) => data.data),
  remove: (id) => api.delete(`/employees/${id}`).then(({ data }) => data),
};
