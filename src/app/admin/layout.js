import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminRealtimeNotifications from "@/components/admin/AdminRealtimeNotifications";
import AdminAccessGuard from "@/components/admin/AdminAccessGuard";

export default function AdminLayout({
  children,
}) {
  return (
    <AdminAccessGuard>
      <div className="min-h-[calc(100vh-72px)] bg-[#f5f4f1]">
        <AdminSidebar />

        <AdminRealtimeNotifications />

        <main className="lg:pl-[280px]">
          {children}
        </main>
      </div>
    </AdminAccessGuard>
  );
}