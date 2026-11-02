import ProjectsGallery from "./ProjectsGallery";


export const metadata = {
  title:
    "Proyectos de arquitectura e interiorismo | Laminati Chile",
  description:
    "Descubre proyectos y aplicaciones reales con laminados HPL Abet Laminati, MEG y superficies técnicas para arquitectura, interiorismo, mobiliario y retail.",
  alternates: {
    canonical:
      "/proyectos",
  },
  openGraph: {
    title:
      "Proyectos de arquitectura e interiorismo | Laminati Chile",
    description:
      "Proyectos reales con laminados HPL Abet Laminati, MEG y superficies para arquitectura, interiorismo y mobiliario.",
    url: "/proyectos",
    siteName: "Laminati Chile",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title:
      "Proyectos de arquitectura e interiorismo | Laminati Chile",
    description:
      "Aplicaciones reales de HPL, MEG y superficies Laminati en proyectos de arquitectura e interiorismo.",
  },
};


export default function ProyectosPage() {
  return (
    <main className="bg-[#f4f1eb] text-[#151515]">
      <ProjectsGallery />
    </main>
  );
}
