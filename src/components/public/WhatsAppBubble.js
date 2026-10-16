"use client";

import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = [
  "/admin",
  "/login",
  "/registro",
  "/mi-cuenta",
];

const WHATSAPP_NUMBER = String(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""
).replace(/\D/g, "");

function getContextMessage(pathname) {
  if (pathname === "/") {
    return "Hola Laminati, quisiera hacer una consulta desde su sitio web.";
  }

  if (
    pathname === "/productos" ||
    pathname.startsWith("/productos?")
  ) {
    return "Hola Laminati, estoy revisando sus productos y quisiera recibir más información.";
  }

  if (pathname.startsWith("/productos/")) {
    return "Hola Laminati, estoy viendo un producto en su sitio web y quisiera recibir más información.";
  }

  if (pathname.startsWith("/colecciones")) {
    return "Hola Laminati, estoy revisando sus colecciones y quisiera recibir asesoría.";
  }

  if (pathname.startsWith("/carrito")) {
    return "Hola Laminati, necesito ayuda con mi compra.";
  }

  if (pathname.startsWith("/proyectos")) {
    return "Hola Laminati, quisiera conversar sobre un proyecto.";
  }

  return "Hola Laminati, quisiera hacer una consulta desde su sitio web.";
}

export default function WhatsAppBubble() {
  const pathname = usePathname();

  const isHidden =
    HIDDEN_PREFIXES.some(
      (prefix) =>
        pathname === prefix ||
        pathname.startsWith(`${prefix}/`)
    );

  if (
    isHidden ||
    !WHATSAPP_NUMBER
  ) {
    return null;
  }

  const baseMessage =
    getContextMessage(pathname);

  const fallbackHref =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      baseMessage
    )}`;

  const handleClick = (event) => {
    event.preventDefault();

    const currentUrl =
      typeof window !== "undefined"
        ? window.location.href
        : "";

    const message =
      currentUrl
        ? `${baseMessage}\n\nPágina: ${currentUrl}`
        : baseMessage;

    const url =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="group fixed bottom-5 right-4 z-[90] flex items-end gap-3 sm:bottom-7 sm:right-7">
      <div
        className="
          pointer-events-none
          hidden
          translate-y-1
          rounded-2xl
          border
          border-black/[0.06]
          bg-white
          px-4
          py-3
          text-right
          opacity-0
          shadow-[0_14px_40px_rgba(0,0,0,0.12)]
          transition
          duration-200
          group-hover:translate-y-0
          group-hover:opacity-100
          md:block
        "
      >
        <p className="whitespace-nowrap text-sm font-semibold text-neutral-950">
          ¿Necesitas ayuda?
        </p>

        <p className="mt-0.5 whitespace-nowrap text-xs text-neutral-500">
          Escríbenos por WhatsApp
        </p>
      </div>

      <a
        href={fallbackHref}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar a Laminati por WhatsApp"
        title="Escríbenos por WhatsApp"
        className="
          flex
          h-14
          w-14
          shrink-0
          items-center
          justify-center
          rounded-full
          transition
          duration-200
          hover:-translate-y-0.5
          focus:outline-none
          focus:ring-4
          focus:ring-[#21b524]/20
          sm:h-[60px]
          sm:w-[60px]
        "
      >
        <img
          src="/icons/whatsapp-icon.png"
          alt=""
          aria-hidden="true"
          className="
            h-full
            w-full
            object-contain
            drop-shadow-[0_10px_22px_rgba(0,0,0,0.20)]
          "
        />
      </a>
    </div>
  );
}
