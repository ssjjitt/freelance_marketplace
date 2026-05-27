export interface PlatformStats {
  totalUsers: number;
  totalOrders: number;
  totalServices: number;
  totalCategories: number;
  totalApplications: number;
  activeOrders: number;
  completedOrders: number;
}

export interface HomeCategory {
  id: number;
  name: string;
  description?: string;
  orderCount?: number;
  serviceCount?: number;
  createdAt?: string;
}

export interface HomeOrder {
  id: number;
  title: string;
  description: string;
  budget?: number;
  status: string;
  category?: HomeCategory;
  customer?: { id: number; username: string };
  createdAt: string;
}

export interface HomeService {
  id: number;
  title: string;
  description: string;
  price?: number;
  status: string;
  category?: HomeCategory;
  executer?: { id: number; username: string };
  isApproved?: boolean;
  createdAt: string;
  attachments?: {
    id: number;
    url: string;
    mimeType?: string | null;
    originalName?: string;
  }[];
}

export interface HomeUser {
  id: number;
  username: string;
  fullName: string;
  avatar?: string | null;
  rating: number;
  completedOrdersThisWeek?: number;
  totalCompleted?: number;
  ordersThisWeek?: number;
  totalOrders?: number;
}

export interface HomeActivity {
  type: string;
  message: string;
  userId: number;
  username: string;
  userAvatar?: string | null;
  orderId: number;
  orderTitle: string;
  timestamp: string;
}
