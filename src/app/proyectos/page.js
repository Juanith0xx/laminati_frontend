import ProjectsGallery from "./ProjectsGallery";


export const metadata = {
  title:
    "Proyectos | Laminati",
  description:
    "Descubre proyectos y aplicaciones reales de laminados, HPL y superficies Laminati en arquitectura, interiorismo, mobiliario, retail y espacios técnicos.",
  alternates: {
    canonical:
      "/proyectos",
  },
};


export default function ProyectosPage() {
  return (
    <main className="bg-[#f4f1eb] text-[#151515]">
      <ProjectsGallery />
    </main>
  );
}
