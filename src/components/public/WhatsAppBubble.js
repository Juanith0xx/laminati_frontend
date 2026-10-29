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
          bg-[#25D366]
          text-white
          shadow-[0_10px_25px_rgba(37,211,102,0.35)]
          transition
          duration-200
          hover:-translate-y-0.5
          hover:scale-105
          focus:outline-none
          focus:ring-4
          focus:ring-[#25D366]/20
          sm:h-[60px]
          sm:w-[60px]
        "
      >
        <svg
          viewBox="0 0 32 32"
          fill="currentColor"
          aria-hidden="true"
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <path d="M19.11 17.37c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.59.13-.17.26-.67.85-.82 1.02-.15.17-.3.2-.56.07-.26-.13-1.1-.41-2.1-1.29-.78-.69-1.3-1.54-1.45-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.46-.07-.13-.59-1.41-.8-1.93-.21-.51-.43-.44-.59-.45h-.5c-.17 0-.46.07-.69.33-.24.26-.91.89-.91 2.17s.93 2.52 1.06 2.69c.13.17 1.83 2.79 4.43 3.91.62.27 1.1.43 1.48.55.62.2 1.19.17 1.64.1.5-.07 1.54-.63 1.76-1.24.22-.61.22-1.13.15-1.24-.06-.11-.24-.17-.5-.3Z" />
          <path d="M16.03 3C8.84 3 3 8.75 3 15.84c0 2.26.6 4.47 1.74 6.41L3 29l6.93-1.8a13.1 13.1 0 0 0 6.1 1.5h.01C23.22 28.7 29 22.95 29 15.86 29 8.76 23.22 3 16.03 3Zm0 23.53h-.01a10.9 10.9 0 0 1-5.56-1.52l-.4-.24-4.11 1.07 1.1-3.96-.26-.41a10.56 10.56 0 0 1-1.65-5.63c0-5.89 4.89-10.68 10.9-10.68 2.91 0 5.64 1.12 7.69 3.14a10.5 10.5 0 0 1 3.19 7.55c0 5.89-4.89 10.68-10.89 10.68Z" />
        </svg>
      </a>
    </div>
  );
}
