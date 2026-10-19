import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminRealtimeNotifications from "@/components/admin/AdminRealtimeNotifications";
import AdminAccessGuard from "@/components/admin/AdminAccessGuard";
import AdminSessionManager from "@/components/admin/AdminSessionManager";

export default function AdminLayout({
  children,
}) {
  return (
    <AdminAccessGuard>
      <div className="min-h-[calc(100vh-72px)] bg-[#f5f4f1]">
        <AdminSidebar />

        <AdminRealtimeNotifications />

        <AdminSessionManager />

        <main className="lg:pl-[280px]">
          {children}
        </main>
      </div>
    </AdminAccessGuard>
  );
}
