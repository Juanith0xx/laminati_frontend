import {
  notFound,
} from "next/navigation";

import ProjectDetail from "./ProjectDetail";


const API_URL = (
  process.env.API_SERVER_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).replace(/\/$/, "");


async function loadProject(
  slug
) {
  if (
    !API_URL ||
    !slug ||
    !/^https?:\/\//i.test(API_URL)
  ) {
    throw new Error(
      "API_SERVER_URL no está configurada con una URL absoluta"
    );
  }

  const response =
    await fetch(
      `${API_URL}/public/projects/${encodeURIComponent(
        slug
      )}`,
      {
        cache:
          "no-store",
      }
    );

  if (
    response.status ===
    404
  ) {
    return null;
  }

  if (
    !response.ok
  ) {
    throw new Error(
      "No fue posible cargar el proyecto"
    );
  }

  const data =
    await response.json();

  return (
    data?.project ||
    null
  );
}


export async function generateMetadata({
  params,
}) {
  const {
    slug,
  } =
    await params;

  const project =
    await loadProject(
      slug
    );

  if (!project) {
    return {
      title:
        "Proyecto no encontrado | Laminati",
      robots: {
        index:
          false,
        follow:
          false,
      },
    };
  }

  const title =
    project.meta_title ||
    `${project.title} | Proyectos Laminati`;

  const description =
    project.meta_description ||
    project.short_description ||
    `Conoce ${project.title}, un proyecto con superficies y soluciones Laminati.`;

  const image =
    project.cover_image_url ||
    project.images?.[0]
      ?.urls?.detail ||
    project.images?.[0]
      ?.image_url ||
    null;

  return {
    title,
    description,

    alternates: {
      canonical:
        `/proyectos/${project.slug}`,
    },

    openGraph: {
      title,
      description,
      type:
        "article",
      ...(image
        ? {
            images: [
              {
                url:
                  image,
                alt:
                  project.title,
              },
            ],
          }
        : {}),
    },
  };
}


export default async function ProjectPage({
  params,
}) {
  const {
    slug,
  } =
    await params;

  const project =
    await loadProject(
      slug
    );

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetail
      project={
        project
      }
    />
  );
}
