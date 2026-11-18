"use client";

import { useRouter } from "next/navigation";

export default function ProductBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/productos");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="
        group
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-neutral-200
        bg-white
        px-4
        py-2.5
        text-sm
        font-medium
        text-neutral-700
        shadow-sm
        transition
        duration-200
        hover:border-emerald-700
        hover:text-emerald-800
        hover:shadow-md
        focus:outline-none
        focus:ring-2
        focus:ring-emerald-700
        focus:ring-offset-2
      "
      aria-label="Volver a la página anterior"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        aria-hidden="true"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>

      <span>Volver</span>
    </button>
  );
}
