"use client";

import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = [
  "/admin",
  "/login",
  "/registro",
  "/checkout",
  "/mi-cuenta",
];

export default function FooterVisibility({
  children,
}) {
  const pathname = usePathname();

  const hidden = HIDDEN_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
  );

  return hidden ? null : children;
}
