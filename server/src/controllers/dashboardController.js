import { getDashboard } from "../services/dashboardService.js";

export async function get(_req, res) {
  res.json(await getDashboard());
}
