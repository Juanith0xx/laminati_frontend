import GerenciaAccessGuard from "@/components/gerencia/GerenciaAccessGuard";
import GerenciaSidebar from "@/components/gerencia/GerenciaSidebar";

export const metadata = {
  title:
    "Gerencia | Laminati",
  description:
    "Panel de Gerencia para distribución en Chile.",
};

export default function GerenciaLayout({
  children,
}) {
  return (
    <GerenciaAccessGuard>
      <div className="min-h-[calc(100vh-72px)] bg-[#f5f4f1]">
        <GerenciaSidebar />

        <main className="lg:pl-[280px]">
          {
            children
          }
        </main>
      </div>
    </GerenciaAccessGuard>
  );
}
