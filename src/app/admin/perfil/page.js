"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { apiRequest } from "@/services/api";
import {
  clearAuthSession,
  updateStoredUser,
} from "@/services/auth.service";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  phone: "",
};

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase();
}

function formatDateTime(value) {
  if (!value) {
    return "Sin registro";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(date);
}

function getInitials(user) {
  const first = String(user?.first_name || "").trim();
  const last = String(user?.last_name || "").trim();

  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`
      .toUpperCase()
      .trim();
  }

  const email = String(user?.email || "").trim();
  return email ? email.charAt(0).toUpperCase() : "U";
}

function Icon({
  name,
  className = "h-5 w-5",
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </svg>
    );
  }

  if (name === "mail") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (name === "phone") {
    return (
      <svg {...common}>
        <path d="M6.6 3.8 9 8l-1.8 1.8a15.8 15.8 0 0 0 7 7L16 15l4.2 2.4-.4 3c-.1.9-.9 1.6-1.8 1.6C9.2 22 2 14.8 2 6c0-.9.7-1.7 1.6-1.8l3-.4Z" />
      </svg>
    );
  }

  if (name === "card") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 14h3" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg {...common}>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (name === "key") {
    return (
      <svg {...common}>
        <circle cx="8" cy="15" r="4" />
        <path d="m11 12 8-8M15 8l2 2M17 6l2 2" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.8 2.7 8.1 7 10 4.3-1.9 7-5.2 7-10V6l-7-3Z" />
        <path d="m9.5 12 1.7 1.7 3.6-4" />
      </svg>
    );
  }

  if (name === "grid") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0M16 6.5a3 3 0 0 1 0 5.5M17 14a5 5 0 0 1 4 4.8" />
      </svg>
    );
  }

  if (name === "bell") {
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...common}>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
        <path d="m14 8 4 4-4 4M18 12H9" />
      </svg>
    );
  }

  if (name === "bolt") {
    return (
      <svg {...common}>
        <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />
      </svg>
    );
  }

  if (name === "document") {
    return (
      <svg {...common}>
        <path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v4h4M8 12h8M8 16h6" />
      </svg>
    );
  }

  return null;
}

function SectionTitle({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f1ed] text-black">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>

      <div>
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-black">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 text-sm leading-6 text-neutral-500">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-3 border-t border-black/5 py-4 sm:grid-cols-[36px_180px_1fr] sm:items-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700">
        <Icon name={icon} className="h-4 w-4" />
      </span>

      <span className="text-sm text-neutral-500">
        {label}
      </span>

      <span className="col-start-2 break-words text-sm font-medium text-neutral-900 sm:col-start-3 sm:text-right">
        {value || "No informado"}
      </span>
    </div>
  );
}

function SecurityItem({
  icon,
  title,
  description,
  meta,
  onClick,
  disabled = false,
}) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-800">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-neutral-900">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-neutral-500">
          {description}
        </span>
      </span>

      {meta ? (
        <span className="hidden text-xs text-neutral-400 md:block">
          {meta}
        </span>
      ) : null}

      {!disabled ? (
        <span className="text-neutral-400">→</span>
      ) : null}
    </>
  );

  if (onClick && !disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 text-left transition hover:border-black/10 hover:bg-neutral-50"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3">
      {content}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
  onClick,
}) {
  const classes =
    "flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 text-left transition hover:border-black/10 hover:bg-neutral-50";

  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-800">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-neutral-900">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-neutral-500">
          {description}
        </span>
      </span>

      <span className="text-neutral-400">→</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={classes}
    >
      {content}
    </Link>
  );
}

function ChangePasswordModal({
  open,
  onClose,
}) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) {
      setForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setError("");
      setSuccess("");
      setSaving(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.new_password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError("La confirmación de contraseña no coincide.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: form,
      });

      setSuccess("Contraseña actualizada correctamente.");
      setForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible cambiar la contraseña."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cerrar cambio de contraseña"
        onClick={saving ? undefined : onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative z-10 w-full max-w-lg rounded-[28px] border border-black/5 bg-[#fffefa] p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f3f1ed] text-black">
              <Icon name="key" className="h-5 w-5" />
            </span>

            <div>
              <h2
                id="change-password-title"
                className="text-xl font-semibold tracking-[-0.03em] text-black"
              >
                Cambiar contraseña
              </h2>
              <p className="mt-1 text-sm leading-6 text-neutral-500">
                Confirma tu contraseña actual antes de establecer una nueva.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-lg text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-4"
        >
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-neutral-600">
              Contraseña actual
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.current_password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  current_password: event.target.value,
                }))
              }
              required
              className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/[0.03]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-neutral-600">
              Nueva contraseña
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.new_password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  new_password: event.target.value,
                }))
              }
              minLength={8}
              required
              className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/[0.03]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-neutral-600">
              Confirmar nueva contraseña
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confirm_password: event.target.value,
                }))
              }
              minLength={8}
              required
              className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/[0.03]"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-black/10 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const avatarInputRef = useRef(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [meResponse, sessionResponse] = await Promise.all([
        apiRequest("/auth/me"),
        apiRequest("/auth/session"),
      ]);

      const currentUser = meResponse?.user || null;
      const role = normalizeRole(currentUser?.role);

      if (!currentUser) {
        throw new Error("No fue posible obtener los datos de tu cuenta.");
      }

      if (!["ADMIN", "VENDEDOR"].includes(role)) {
        router.replace("/mi-cuenta");
        return;
      }

      setUser(currentUser);
      setSessionInfo(sessionResponse || null);
      setForm({
        first_name: currentUser.first_name || "",
        last_name: currentUser.last_name || "",
        phone: currentUser.phone || "",
      });
    } catch (requestError) {
      if (requestError?.status === 401) {
        router.replace("/login?redirect=/admin/perfil");
        return;
      }

      setError(
        requestError?.message ||
          "No fue posible cargar tu perfil."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const initials = useMemo(
    () => getInitials(user),
    [user]
  );

  const fullName = useMemo(() => {
    const value = [
      user?.first_name,
      user?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return value || user?.email || "Usuario";
  }, [user]);

  const role = normalizeRole(user?.role);
  const roleLabel =
    user?.role_label ||
    (role === "VENDEDOR" ? "Vendedor" : "Administrador");

  const sessionDuration =
    sessionInfo?.renewal_duration_label ||
    (role === "VENDEDOR" ? "4 horas" : "2 horas");

  const handleCancel = () => {
    setForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
    });
    setError("");
    setSuccess("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.first_name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!form.last_name.trim()) {
      setError("El apellido es obligatorio.");
      return;
    }

    setSaving(true);

    try {
      const response = await apiRequest("/auth/me", {
        method: "PATCH",
        body: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim() || null,
        },
      });

      const updatedUser = response?.user;

      if (!updatedUser) {
        throw new Error("El servidor no devolvió el perfil actualizado.");
      }

      setUser(updatedUser);
      setForm({
        first_name: updatedUser.first_name || "",
        last_name: updatedUser.last_name || "",
        phone: updatedUser.phone || "",
      });

      updateStoredUser(updatedUser);

      setSuccess("Tus datos se actualizaron correctamente.");
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible guardar los cambios."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (event) => {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    const allowedTypes =
      new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
      ]);

    if (!allowedTypes.has(file.type)) {
      setError(
        "La foto de perfil debe ser JPG, JPEG, PNG o WEBP."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError(
        "La foto de perfil no puede superar los 3 MB."
      );

      event.target.value = "";
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "avatar",
      file
    );

    setAvatarSaving(true);

    try {
      const response =
        await apiRequest(
          "/auth/me/avatar",
          {
            method: "PATCH",
            body: formData,
          }
        );

      const updatedUser =
        response?.user;

      if (!updatedUser) {
        throw new Error(
          "El servidor no devolvió el perfil actualizado."
        );
      }

      setUser(updatedUser);
      updateStoredUser(
        updatedUser
      );

      setSuccess(
        "Tu foto de perfil se actualizó correctamente."
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible actualizar la foto de perfil."
      );
    } finally {
      setAvatarSaving(false);

      if (
        avatarInputRef.current
      ) {
        avatarInputRef.current.value =
          "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.avatar_url) {
      return;
    }

    setError("");
    setSuccess("");
    setAvatarSaving(true);

    try {
      const response =
        await apiRequest(
          "/auth/me/avatar",
          {
            method: "DELETE",
          }
        );

      const updatedUser =
        response?.user;

      if (!updatedUser) {
        throw new Error(
          "El servidor no devolvió el perfil actualizado."
        );
      }

      setUser(updatedUser);
      updateStoredUser(
        updatedUser
      );

      setSuccess(
        "Tu foto de perfil se eliminó correctamente."
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible eliminar la foto de perfil."
      );
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Aunque el servidor no responda, limpiamos el estado local.
    } finally {
      clearAuthSession();
      router.replace("/login");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1500px] animate-pulse">
          <div className="h-3 w-28 rounded bg-black/5" />
          <div className="mt-4 h-9 w-48 rounded bg-black/5" />
          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            <div className="h-[420px] rounded-[28px] bg-white/70" />
            <div className="h-[420px] rounded-[28px] bg-white/70" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-8 sm:px-6 lg:px-8 xl:px-10 xl:py-10">
        <div className="mx-auto max-w-[1500px]">
          <header>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
              Administración
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-black sm:text-4xl">
              Mi Perfil
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500 sm:text-base">
              Gestiona tu información personal y la seguridad de tu cuenta administrativa.
            </p>
          </header>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="mt-7 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.025)] sm:p-7">
              <SectionTitle
                icon="user"
                title={role === "VENDEDOR" ? "Perfil de vendedor" : "Perfil de administrador"}
              />

              <div className="flex flex-col items-center px-2 pb-5 pt-7 text-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[#f0ede7] ring-4 ring-white shadow-sm sm:h-28 sm:w-28">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={`Foto de perfil de ${fullName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-semibold tracking-[-0.04em] text-black sm:text-4xl">
                      {initials}
                    </div>
                  )}
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={handleAvatarSelect}
                  disabled={avatarSaving}
                  className="sr-only"
                />

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      avatarInputRef.current?.click()
                    }
                    disabled={avatarSaving}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-black px-4 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {avatarSaving
                      ? "Procesando..."
                      : user?.avatar_url
                        ? "Cambiar foto"
                        : "Subir foto"}
                  </button>

                  {user?.avatar_url ? (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={avatarSaving}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Eliminar foto
                    </button>
                  ) : null}
                </div>

                <p className="mt-2 text-[11px] text-neutral-400">
                  JPG, PNG o WEBP · máximo 3 MB
                </p>

                <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-black">
                  {fullName}
                </h2>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-medium text-neutral-700">
                    {roleLabel}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Activo
                  </span>
                </div>
              </div>

              <div>
                <ProfileRow
                  icon="mail"
                  label="Correo electrónico"
                  value={user?.email}
                />
                <ProfileRow
                  icon="phone"
                  label="Teléfono"
                  value={user?.phone}
                />
                <ProfileRow
                  icon="card"
                  label="RUT"
                  value={user?.rut}
                />
                <ProfileRow
                  icon="clock"
                  label="Último acceso"
                  value={formatDateTime(user?.last_login_at)}
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.025)] sm:p-7">
              <SectionTitle
                icon="document"
                title="Información personal"
                description="Actualiza tus datos personales. El correo, RUT y rol se mantienen protegidos desde administración."
              />

              <form
                onSubmit={handleSave}
                className="mt-7"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-neutral-600">
                      Nombre
                    </span>
                    <input
                      value={form.first_name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          first_name: event.target.value,
                        }))
                      }
                      maxLength={100}
                      required
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/[0.03]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-neutral-600">
                      Apellido
                    </span>
                    <input
                      value={form.last_name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          last_name: event.target.value,
                        }))
                      }
                      maxLength={100}
                      required
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/[0.03]"
                    />
                  </label>
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-xs font-medium text-neutral-600">
                    Correo electrónico
                  </span>
                  <input
                    value={user?.email || ""}
                    readOnly
                    className="h-12 w-full cursor-not-allowed rounded-xl border border-black/5 bg-neutral-50 px-4 text-sm text-neutral-500 outline-none"
                  />
                </label>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-neutral-600">
                      Teléfono
                    </span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      maxLength={30}
                      placeholder="+56 9 1234 5678"
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/[0.03]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-neutral-600">
                      RUT
                    </span>
                    <input
                      value={user?.rut || "No informado"}
                      readOnly
                      className="h-12 w-full cursor-not-allowed rounded-xl border border-black/5 bg-neutral-50 px-4 text-sm text-neutral-500 outline-none"
                    />
                  </label>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="h-11 rounded-xl border border-black/10 bg-white px-6 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="h-11 rounded-xl bg-black px-7 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.025)] sm:p-7">
              <SectionTitle
                icon="lock"
                title="Seguridad"
                description="Administra la seguridad de tu cuenta del backoffice."
              />

              <div className="mt-6 space-y-3">
                <SecurityItem
                  icon="key"
                  title="Cambiar contraseña"
                  description="Actualiza tu contraseña de acceso."
                  onClick={() => setPasswordOpen(true)}
                />

                <SecurityItem
                  icon="clock"
                  title="Sesión administrativa"
                  description={`Duración de sesión: ${sessionDuration}`}
                  meta="Recibirás un aviso antes del vencimiento."
                  disabled
                />

                <SecurityItem
                  icon="shield"
                  title="Autenticación"
                  description="Tu sesión utiliza una cookie HttpOnly protegida y validada por el servidor."
                  disabled
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.025)] sm:p-7">
              <SectionTitle
                icon="bolt"
                title="Accesos rápidos"
                description="Accede rápidamente a las secciones más utilizadas."
              />

              <div className="mt-6 space-y-3">
                <QuickLink
                  href="/admin/dashboard"
                  icon="grid"
                  title="Ir al Dashboard"
                  description="Resumen general del backoffice."
                />

                {role === "ADMIN" ? (
                  <QuickLink
                    href="/admin/usuarios"
                    icon="users"
                    title="Usuarios"
                    description="Gestiona los usuarios y sus accesos."
                  />
                ) : null}

                <QuickLink
                  href="/admin/notificaciones"
                  icon="bell"
                  title="Notificaciones"
                  description="Revisa las novedades del backoffice."
                />

                <QuickLink
                  icon="logout"
                  title="Cerrar sesión"
                  description="Finaliza tu sesión de forma segura."
                  onClick={handleLogout}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </>
  );
}
