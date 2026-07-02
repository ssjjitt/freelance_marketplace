import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;
const cfg = () => getAuthAxiosConfig();

type ReportTargetType = "user" | "order" | "service";

const createReport = (data: { targetId: number; targetType: ReportTargetType; reason: string }) => {
  return withApiCall("report.create", () => axios.post(API_URL + "reports", data, cfg()));
};

const ReportService = {
  createReport,
};

export default ReportService;
