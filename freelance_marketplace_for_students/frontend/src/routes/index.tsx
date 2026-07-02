import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import LoginPage from "../pages/login-page";
import RegisterPage from "../pages/register-page";
import VerifyPage from "../pages/verify-page";
import CatalogPage from "../pages/catalog-page";
import OrderDetailPage from "../pages/order-detail-page";
import ServiceDetailPage from "../pages/service-detail-page";
import WorkProfilePage from "../pages/work-profile-page";
import HomePage from "../pages/home-page";
import ProfileEditorPage from "../pages/profile-editor-page";
import OrderFormPage from "../pages/order-form-page";
import ServiceFormPage from "../pages/service-form-page";
import FavoritesPage from "../pages/favorites-page";
import ResumeFormPage from "../pages/resume-form-page";
import ResumeViewPage from "../pages/resume-view-page";
import AdminPanelPage from "../pages/admin-panel-page";
import AdminResumesPage from "../pages/admin-resumes-page";
import AdminServicesPage from "../pages/admin-services-page";
import ModerationDashboardPage from "../pages/moderation-dashboard-page";
import ManagerDashboardPage from "../pages/manager-dashboard-page";
import TicketListPage from "../pages/ticket-list-page";
import TicketDetailPage from "../pages/ticket-detail-page";
import DisputeListPage from "../pages/dispute-list-page";
import DisputeDetailPage from "../pages/dispute-detail-page";
import UserModerationPage from "../pages/user-moderation-page";
import OrderModerationPage from "../pages/order-moderation-page";
import ResumeModerationPage from "../pages/resume-moderation-page";
import ServiceModerationPage from "../pages/service-moderation-page";
import ChatsPage from "../pages/chats-page";
import MyItemsPage from "../pages/my-items-page";
import NotificationsPage from "../pages/notifications-page";
import ApplicationHistoryPage from "../pages/applications-history-page";
import ApplicationsPage from "../pages/applications-page";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route
        path="/catalog"
        element={
          <ProtectedRoute allowPublic>
            <CatalogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute allowPublic>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/:id"
        element={
          <ProtectedRoute allowPublic>
            <ServiceDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute allowPublic>
            <WorkProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute allowPublic>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <WorkProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <ProfileEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/new"
        element={
          <ProtectedRoute>
            <OrderFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id/edit"
        element={
          <ProtectedRoute>
            <OrderFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/new"
        element={
          <ProtectedRoute>
            <ServiceFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/:id/edit"
        element={
          <ProtectedRoute>
            <ServiceFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes/new"
        element={
          <ProtectedRoute>
            <ResumeFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes/:id"
        element={
          <ProtectedRoute>
            <ResumeViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes/:id/edit"
        element={
          <ProtectedRoute>
            <ResumeFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanelPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resumes"
        element={
          <ProtectedRoute>
            <AdminResumesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute>
            <AdminServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/moderation"
        element={
          <ProtectedRoute>
            <ModerationDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <ChatsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-items"
        element={
          <ProtectedRoute>
            <MyItemsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <ApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications/history"
        element={
          <ProtectedRoute>
            <ApplicationHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute requiredRoles={["manager", "administrator"]}>
            <ManagerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/tickets"
        element={
          <ProtectedRoute requiredRoles={["manager", "administrator"]}>
            <TicketListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/tickets/:id"
        element={
          <ProtectedRoute requiredRoles={["manager", "administrator"]}>
            <TicketDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/disputes"
        element={
          <ProtectedRoute requiredRoles={["manager", "administrator"]}>
            <DisputeListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/disputes/:id"
        element={
          <ProtectedRoute requiredRoles={["manager", "administrator"]}>
            <DisputeDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/users"
        element={
          <ProtectedRoute requiredRoles={["manager", "administrator"]}>
            <UserModerationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/orders"
        element={
          <ProtectedRoute requiredRoles={["manager", "administrator"]}>
            <OrderModerationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/resumes"
        element={
          <ProtectedRoute requiredRoles={["manager", "administrator"]}>
            <ResumeModerationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/services"
        element={
          <ProtectedRoute requiredRoles={["manager", "administrator"]}>
            <ServiceModerationPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
