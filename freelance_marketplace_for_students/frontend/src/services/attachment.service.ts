import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getBearerAuthHeaders } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

export type AttachmentDto = {
  id: number;
  orderId: number | null;
  serviceId: number | null;
  storedPath: string;
  originalName: string;
  mimeType: string | null;
  size: number | null;
  url: string;
  createdAt?: string;
};

function multipartAuth() {
  return {
    headers: getBearerAuthHeaders(),
    withCredentials: true as const,
  };
}

const uploadOrderAttachments = (orderId: number, files: File[]) => {
  if (!files.length) {
    return Promise.reject(new Error("Нет файлов"));
  }
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return withApiCall("attachment.order.upload", () =>
    axios.post<AttachmentDto[]>(`${API_URL}orders/${orderId}/attachments`, fd, multipartAuth())
  );
};

const listOrderAttachments = (orderId: number) =>
  withApiCall("attachment.order.list", () =>
    axios.get<AttachmentDto[]>(`${API_URL}orders/${orderId}/attachments`, { withCredentials: true })
  );

const uploadServiceAttachments = (serviceId: number, files: File[]) => {
  if (!files.length) {
    return Promise.reject(new Error("Нет файлов"));
  }
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return withApiCall("attachment.service.upload", () =>
    axios.post<AttachmentDto[]>(`${API_URL}services/${serviceId}/attachments`, fd, multipartAuth())
  );
};

const listServiceAttachments = (serviceId: number) =>
  withApiCall("attachment.service.list", () =>
    axios.get<AttachmentDto[]>(`${API_URL}services/${serviceId}/attachments`, { withCredentials: true })
  );

const deleteAttachment = (attachmentId: number) =>
  withApiCall("attachment.delete", () =>
    axios.delete(`${API_URL}attachments/${attachmentId}`, {
      headers: getBearerAuthHeaders(),
      withCredentials: true,
    })
  );

const AttachmentService = {
  uploadOrderAttachments,
  listOrderAttachments,
  uploadServiceAttachments,
  listServiceAttachments,
  deleteAttachment,
};

export default AttachmentService;
