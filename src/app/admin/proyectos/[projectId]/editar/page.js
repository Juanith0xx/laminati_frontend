"use client";

import {
  useParams,
} from "next/navigation";

import ProjectEditor from "@/components/admin/projects/ProjectEditor";


export default function EditProjectPage() {
  const params =
    useParams();

  return (
    <ProjectEditor
      mode="edit"
      projectId={
        params.projectId
      }
    />
  );
}
