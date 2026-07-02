import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

// ===== TICKETS =====

const createTicket = (data: {
  subject: string;
  description: string;
  category?: string;
}) => {
  return withApiCall("manager.createTicket", () =>
    axios.post(API_URL + "manager/tickets", data, cfg())
  );
};

const getTickets = (query?: { status?: string; priority?: string; category?: string }) => {
  return withApiCall("manager.getTickets", () =>
    axios.get(API_URL + "manager/tickets", { params: query, ...cfg() })
  );
};

const getTicketById = (ticketId: number) => {
  return withApiCall("manager.getTicketById", () =>
    axios.get(API_URL + `manager/tickets/${ticketId}`, cfg())
  );
};

const updateTicketStatus = (ticketId: number, status: string) => {
  return withApiCall("manager.updateTicketStatus", () =>
    axios.patch(API_URL + `manager/tickets/${ticketId}/status`, { status }, cfg())
  );
};

const assignTicket = (ticketId: number, newManagerId?: number) => {
  return withApiCall("manager.assignTicket", () =>
    axios.patch(API_URL + `manager/tickets/${ticketId}/assign`, { newManagerId }, cfg())
  );
};

// ===== DISPUTES =====

const createDispute = (data: {
  applicationId: number;
  reason: string;
  description?: string;
}) => {
  return withApiCall("manager.createDispute", () =>
    axios.post(API_URL + "manager/disputes", data, cfg())
  );
};

const getDisputes = (query?: { status?: string; resolution?: string }) => {
  return withApiCall("manager.getDisputes", () =>
    axios.get(API_URL + "manager/disputes", { params: query, ...cfg() })
  );
};

const resolveDispute = (
  disputeId: number,
  data: { resolution: string; comment?: string }
) => {
  return withApiCall("manager.resolveDispute", () =>
    axios.patch(API_URL + `manager/disputes/${disputeId}/resolve`, data, cfg())
  );
};

// ===== ORDERS =====

const getOrder = (orderId: number) => {
  return withApiCall("manager.getOrder", () =>
    axios.get(API_URL + `manager/orders/${orderId}`, cfg())
  );
};

const getOrders = () => {
  return withApiCall("manager.getOrders", () =>
    axios.get(API_URL + "manager/orders", cfg())
  );
};

const hideOrder = (orderId: number, data?: { reason?: string }) => {
  return withApiCall("manager.hideOrder", () =>
    axios.patch(API_URL + `manager/orders/${orderId}/hide`, data || {}, cfg())
  );
};

const closeOrder = (orderId: number) => {
  return withApiCall("manager.closeOrder", () =>
    axios.patch(API_URL + `manager/orders/${orderId}/close`, {}, cfg())
  );
};

const unhideOrder = (orderId: number) => {
  return withApiCall("manager.unhideOrder", () =>
    axios.patch(API_URL + `manager/orders/${orderId}/unhide`, {}, cfg())
  );
};

const reopenOrder = (orderId: number) => {
  return withApiCall("manager.reopenOrder", () =>
    axios.patch(API_URL + `manager/orders/${orderId}/reopen`, {}, cfg())
  );
};

const grantOrderTrustBadge = (orderId: number) => {
  return withApiCall("manager.grantOrderTrustBadge", () =>
    axios.patch(API_URL + `manager/orders/${orderId}/trust-badge`, {}, cfg())
  );
};

const hideService = (serviceId: number) => {
  return withApiCall("manager.hideService", () =>
    axios.patch(API_URL + `manager/services/${serviceId}/hide`, {}, cfg())
  );
};

const unhideService = (serviceId: number) => {
  return withApiCall("manager.unhideService", () =>
    axios.patch(API_URL + `manager/services/${serviceId}/unhide`, {}, cfg())
  );
};

const closeService = (serviceId: number) => {
  return withApiCall("manager.closeService", () =>
    axios.patch(API_URL + `manager/services/${serviceId}/close`, {}, cfg())
  );
};

// ===== USERS =====

const getUserForModeration = (userId: number) => {
  return withApiCall("manager.getUserForModeration", () =>
    axios.get(API_URL + `manager/users/${userId}`, cfg())
  );
};

const getUsersForModeration = (query?: { blockedOnly?: boolean }) => {
  return withApiCall("manager.getUsersForModeration", () =>
    axios.get(API_URL + "manager/users", {
      params: query,
      ...cfg(),
    })
  );
};

const findUserForModerationByUsername = (username: string) => {
  return withApiCall("manager.findUserForModerationByUsername", () =>
    axios.get(API_URL + "manager/users/search", {
      params: { username },
      ...cfg(),
    })
  );
};

const blockUser = (userId: number, data?: { reason?: string }) => {
  return withApiCall("manager.blockUser", () =>
    axios.patch(API_URL + `manager/users/${userId}/block`, data || {}, cfg())
  );
};

const unblockUser = (userId: number) => {
  return withApiCall("manager.unblockUser", () =>
    axios.patch(API_URL + `manager/users/${userId}/unblock`, {}, cfg())
  );
};

// ===== STATISTICS =====

const getManagerStats = () => {
  return withApiCall("manager.getStats", () =>
    axios.get(API_URL + "manager/stats", cfg())
  );
};

// ===== RESUMES =====

const getResumes = () => {
  return withApiCall("manager.getResumes", () =>
    axios.get(API_URL + "manager/resumes", cfg())
  );
};

const getResumeById = (resumeId: number) => {
  return withApiCall("manager.getResumeById", () =>
    axios.get(API_URL + `manager/resumes/${resumeId}`, cfg())
  );
};

// ===== SERVICES =====

const getServices = () => {
  return withApiCall("manager.getServices", () =>
    axios.get(API_URL + "manager/services", cfg())
  );
};

const getServiceById = (serviceId: number) => {
  return withApiCall("manager.getServiceById", () =>
    axios.get(API_URL + `manager/services/${serviceId}`, cfg())
  );
};

const ManagerService = {
  // Tickets
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  // Disputes
  createDispute,
  getDisputes,
  resolveDispute,
  // Orders
  getOrders,
  getOrder,
  hideOrder,
  closeOrder,
  unhideOrder,
  reopenOrder,
  grantOrderTrustBadge,
  // Users
  getUsersForModeration,
  getUserForModeration,
  findUserForModerationByUsername,
  blockUser,
  unblockUser,
  // Statistics
  getManagerStats,
  // Resumes
  getResumes,
  getResumeById,
  // Services
  getServices,
  getServiceById,
  hideService,
  unhideService,
  closeService,
};

export default ManagerService;
