"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  assignAdminUserPriceList,
  createAdminUser,
  deleteAdminUser,
  getAdminUserOptions,
  getAdminUserPriceList,
  listAdminPriceListsForUsers,
  listAdminUsers,
  removeAdminUserPriceList,
  setAdminUserStatus,
  updateAdminUser,
} from "@/services/adminUsers.service";

import PriceListSelector from "@/components/admin/users/PriceListSelector";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  rut: "",
  role: "ADMIN",
  company_id: "",
  position_name: "",
  password: "",
  price_list_id: "",
};

const ROLE_LABELS = {
  ADMIN: "Administrador",
  CLIENTE: "Cliente",
  USUARIO_EMPRESA: "Usuario empresa",
};

function formatRole(role) {
  return ROLE_LABELS[role] || role || "Sin perfil";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getInitials(user) {
  const first = String(user?.first_name || "").trim();
  const last = String(user?.last_name || "").trim();
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-neutral-400"
        }`}
      />
      {active ? "Activo" : "Deshabilitado"}
    </span>
  );
}

function PriceListBadge({ name }) {
  if (!name) {
    return (
      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
        Sin lista
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
      {name}
    </span>
  );
}

function MetricCard({ label, value, caption }) {
  return (
    <article className="rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-black">
        {value}
      </p>
      <p className="mt-1 text-xs text-neutral-500">{caption}</p>
    </article>
  );
}


function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function UserStatusSwitch({ active, onClick, disabled = false }) {
  const label = active ? "Deshabilitar usuario" : "Habilitar usuario";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-8 w-[54px] shrink-0 items-center rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 ${
        active
          ? "border-emerald-500 bg-emerald-500"
          : "border-neutral-300 bg-neutral-300"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          active ? "translate-x-[26px]" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function DeleteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ActionIconButton({
  label,
  icon,
  tone = "neutral",
  onClick,
  disabled = false,
}) {
  const toneClassName =
    tone === "danger"
      ? "border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50"
      : tone === "success"
        ? "border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
        : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white transition ${toneClassName} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span className="sr-only">{label}</span>
      {icon}
    </button>
  );
}

function UserFormModal({
  open,
  mode,
  user,
  roles,
  companies,
  priceLists,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingPriceList, setLoadingPriceList] = useState(false);
  const [originalPriceListId, setOriginalPriceListId] = useState("");
  const [persistedUserId, setPersistedUserId] = useState(null);

  useEffect(() => {
    if (!open) return;

    let active = true;

    setPersistedUserId(null);
    setOriginalPriceListId("");
    setLoadingPriceList(false);

    if (mode === "edit" && user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        rut: user.rut || "",
        role: user.role || "ADMIN",
        company_id: user.company_id || "",
        position_name: user.position_name || "",
        password: "",
        price_list_id: user.price_list_id || "",
      });

      const loadAssignment = async () => {
        try {
          setLoadingPriceList(true);
          const response = await getAdminUserPriceList(user.id);
          const assignedPriceListId = response?.data?.price_list_id || "";

          if (!active) return;

          setOriginalPriceListId(assignedPriceListId);
          setForm((previous) => ({
            ...previous,
            price_list_id: assignedPriceListId,
          }));
        } catch {
          if (!active) return;

          setOriginalPriceListId(user.price_list_id || "");
        } finally {
          if (active) {
            setLoadingPriceList(false);
          }
        }
      };

      loadAssignment();
    } else {
      setForm(EMPTY_FORM);
    }

    setError("");

    return () => {
      active = false;
    };
  }, [open, mode, user]);

  if (!open) return null;

  const isCompanyUser = form.role === "USUARIO_EMPRESA";
  const isCommercialCustomer = ["CLIENTE", "USUARIO_EMPRESA"].includes(
    form.role
  );

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "role" && value !== "USUARIO_EMPRESA"
        ? {
            company_id: "",
            position_name: "",
          }
        : {}),
      ...(field === "role" &&
      !["CLIENTE", "USUARIO_EMPRESA"].includes(value)
        ? {
            price_list_id: "",
          }
        : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Nombre y apellido son obligatorios.");
      return;
    }

    if (!form.email.trim()) {
      setError("El correo electrónico es obligatorio.");
      return;
    }

    if (mode === "create" && form.password.length < 8) {
      setError("La contraseña inicial debe tener al menos 8 caracteres.");
      return;
    }

    if (mode === "edit" && form.password && form.password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (isCompanyUser && !form.company_id) {
      setError("Selecciona la empresa asociada al usuario.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        rut: form.rut.trim() || null,
        role: form.role,
        company_id: isCompanyUser ? form.company_id : null,
        position_name: isCompanyUser
          ? form.position_name.trim() || null
          : null,
        ...(form.password ? { password: form.password } : {}),
      };

      let targetUserId = mode === "edit" ? user.id : persistedUserId;

      if (mode === "create" && !persistedUserId) {
        const created = await createAdminUser(payload);
        targetUserId = created?.data?.id || null;

        if (!targetUserId) {
          throw new Error(
            "El usuario fue creado, pero no fue posible obtener su identificador."
          );
        }

        setPersistedUserId(targetUserId);
      } else {
        await updateAdminUser(targetUserId, payload);
      }

      const desiredPriceListId = isCommercialCustomer
        ? form.price_list_id || ""
        : "";

      if (desiredPriceListId !== originalPriceListId) {
        if (desiredPriceListId) {
          await assignAdminUserPriceList(
            targetUserId,
            desiredPriceListId
          );
        } else if (originalPriceListId) {
          await removeAdminUserPriceList(targetUserId);
        }

        setOriginalPriceListId(desiredPriceListId);
      }

      await onSaved();
      onClose();
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible guardar el usuario y sus condiciones comerciales."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={saving ? undefined : onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Laminati · Usuarios
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-black">
              {mode === "create" ? "Crear usuario" : "Editar usuario"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {mode === "create"
                ? "Crea una cuenta y define su perfil de acceso."
                : "Actualiza los datos de la cuenta seleccionada."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-6 p-6 sm:p-7">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">Nombre</span>
              <input
                value={form.first_name}
                onChange={(event) =>
                  updateField("first_name", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="Nombre"
                autoComplete="off"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">Apellido</span>
              <input
                value={form.last_name}
                onChange={(event) =>
                  updateField("last_name", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="Apellido"
                autoComplete="off"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold text-neutral-700">Correo electrónico</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="usuario@laminatiword.cl"
                autoComplete="off"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">RUT</span>
              <input
                value={form.rut}
                onChange={(event) =>
                  updateField("rut", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="12.345.678-9"
                autoComplete="off"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">Teléfono</span>
              <input
                value={form.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="+56 9 ..."
                autoComplete="off"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">Perfil</span>
              <select
                value={form.role}
                onChange={(event) =>
                  updateField("role", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {formatRole(role.name)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">
                {mode === "create" ? "Contraseña inicial" : "Nueva contraseña"}
              </span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder={
                  mode === "create"
                    ? "Mínimo 8 caracteres"
                    : "Déjala vacía para conservarla"
                }
                autoComplete="new-password"
              />
            </label>
          </div>

          {isCompanyUser && (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Asociación empresa
              </p>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-700">Empresa</span>
                  <select
                    value={form.company_id}
                    onChange={(event) =>
                      updateField("company_id", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
                  >
                    <option value="">Seleccionar empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.trade_name || company.legal_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-700">Cargo / referencia</span>
                  <input
                    value={form.position_name}
                    onChange={(event) =>
                      updateField("position_name", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
                    placeholder="Ej. Compras"
                  />
                </label>
              </div>
            </div>
          )}

          {isCommercialCustomer && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
                Condiciones comerciales
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Asigna una lista de precios al cliente. La lista define descuentos
                comerciales por producto o colección.
              </p>

              <div className="mt-4">
                <PriceListSelector
                  priceLists={priceLists}
                  value={form.price_list_id}
                  onChange={(value) =>
                    updateField("price_list_id", value)
                  }
                  disabled={saving || loadingPriceList}
                  loading={loadingPriceList}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-500">
            Deshabilitar conserva la cuenta y su historial. Eliminar utiliza eliminación lógica para mantener pedidos, pagos y trazabilidad comercial.
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : mode === "create"
                  ? "Crear usuario"
                  : "Guardar cambios"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ConfirmationModal({ action, onClose, onConfirm, busy }) {
  if (!action) return null;

  const isDelete = action.type === "delete";
  const isEnable = action.type === "enable";

  const title = isDelete
    ? "Eliminar usuario"
    : isEnable
      ? "Habilitar usuario"
      : "Deshabilitar usuario";

  const description = isDelete
    ? "La cuenta dejará de aparecer en la gestión de usuarios, pero su historial comercial se conservará."
    : isEnable
      ? "El usuario podrá volver a iniciar sesión con sus credenciales."
      : "El usuario no podrá iniciar una nueva sesión mientras permanezca deshabilitado.";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={busy ? undefined : onClose}
      />

      <div className="relative w-full max-w-md rounded-[26px] bg-white p-6 shadow-2xl sm:p-7">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Confirmación
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {description}
        </p>

        <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3">
          <p className="font-semibold text-neutral-900">
            {action.user.first_name} {action.user.last_name}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {action.user.email}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-11 rounded-xl px-5 text-sm font-semibold text-white transition disabled:opacity-50 ${
              isDelete || action.type === "disable"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-black hover:bg-neutral-800"
            }`}
          >
            {busy ? "Procesando..." : title}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "ALL",
    status: "ALL",
  });
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [action, setAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const loadOptions = useCallback(async () => {
    const [userOptions, priceListResponse] = await Promise.all([
      getAdminUserOptions(),
      listAdminPriceListsForUsers(),
    ]);

    setRoles(userOptions?.roles || []);
    setCompanies(userOptions?.companies || []);
    setPriceLists(priceListResponse?.data || []);
  }, []);

  const loadUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");

        const response = await listAdminUsers({
          search: filters.search,
          role: filters.role,
          status: filters.status,
          page,
          limit: 20,
        });

        const baseUsers = response?.data || [];

        const enrichedUsers = await Promise.all(
          baseUsers.map(async (user) => {
            if (!["CLIENTE", "USUARIO_EMPRESA"].includes(user.role)) {
              return {
                ...user,
                price_list_id: null,
                price_list_name: null,
                price_list_assignment: null,
              };
            }

            try {
              const assignmentResponse =
                await getAdminUserPriceList(user.id);
              const assignment = assignmentResponse?.data || null;

              return {
                ...user,
                price_list_id: assignment?.price_list_id || null,
                price_list_name:
                  assignment?.price_list_name || null,
                price_list_assignment: assignment,
              };
            } catch {
              return {
                ...user,
                price_list_id: null,
                price_list_name: null,
                price_list_assignment: null,
              };
            }
          })
        );

        setUsers(enrichedUsers);
        setSummary(
          response?.summary || {
            total: 0,
            active: 0,
            inactive: 0,
            admins: 0,
          }
        );
        setPagination(
          response?.pagination || {
            page: 1,
            total_pages: 1,
            total: 0,
          }
        );
      } catch (requestError) {
        setError(
          requestError?.message ||
            "No fue posible cargar los usuarios."
        );
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadOptions().catch((requestError) => {
      setError(
        requestError?.message ||
          "No fue posible cargar las opciones de usuarios."
      );
    });
  }, [loadOptions]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((previous) => ({
        ...previous,
        search: searchInput.trim(),
      }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const roleOptions = useMemo(
    () => roles.map((role) => ({
      value: role.name,
      label: formatRole(role.name),
    })),
    [roles]
  );

  const handleRefresh = async () => {
    await Promise.all([
      loadOptions(),
      loadUsers(pagination.page || 1),
    ]);
  };

  const handleConfirmedAction = async () => {
    if (!action?.user?.id) return;

    try {
      setActionBusy(true);
      setError("");

      if (action.type === "delete") {
        await deleteAdminUser(action.user.id);
      } else {
        await setAdminUserStatus(
          action.user.id,
          action.type === "enable"
        );
      }

      setAction(null);
      await loadUsers(pagination.page || 1);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible completar la acción."
      );
      setAction(null);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.05)]">
        <div className="h-[3px] bg-gradient-to-r from-red-400 via-pink-400 to-violet-600" />
        <div className="flex flex-col gap-5 px-6 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Laminati · Backoffice
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black">
              Usuarios
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Crea, edita, habilita, deshabilita y elimina cuentas desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleRefresh}
              className="h-11 rounded-full border border-black/10 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => setModal({ mode: "create", user: null })}
              className="h-11 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              + Crear usuario
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Usuarios"
          value={summary.total || 0}
          caption="Cuentas visibles"
        />
        <MetricCard
          label="Activos"
          value={summary.active || 0}
          caption="Pueden iniciar sesión"
        />
        <MetricCard
          label="Deshabilitados"
          value={summary.inactive || 0}
          caption="Acceso suspendido"
        />
        <MetricCard
          label="Administradores"
          value={summary.admins || 0}
          caption="Perfil ADMIN"
        />
      </section>

      <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_.6fr_.6fr_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700">
              Buscar usuario
            </span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nombre, correo o RUT..."
              className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700">Perfil</span>
            <select
              value={filters.role}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  role: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
            >
              <option value="ALL">Todos</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700">Estado</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  status: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Deshabilitados</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setFilters({
                search: "",
                role: "ALL",
                status: "ALL",
              });
            }}
            className="h-11 rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
          >
            Limpiar
          </button>
        </div>
      </section>

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </section>
      )}

      <section className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-black">Usuarios registrados</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {pagination.total || 0} resultado{pagination.total === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-neutral-500">
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-xl">
              👤
            </div>
            <p className="mt-4 font-semibold text-neutral-900">Sin usuarios para mostrar</p>
            <p className="mt-1 text-sm text-neutral-500">
              Cambia los filtros o crea una nueva cuenta.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1180px] border-collapse text-left">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    <th className="px-6 py-3.5">Usuario</th>
                    <th className="px-4 py-3.5">Perfil</th>
                    <th className="px-4 py-3.5">Empresa</th>
                    <th className="px-4 py-3.5">Lista de precios</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5 text-center">Acceso</th>
                    <th className="px-4 py-3.5">Último acceso</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-neutral-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                            {getInitials(user)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-neutral-900">
                                {user.first_name} {user.last_name}
                              </p>
                              {user.is_self && (
                                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                  Tú
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-neutral-500">
                              {user.email}
                              {user.rut ? ` · ${user.rut}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-700">
                        {formatRole(user.role)}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        {user.company_name || "—"}
                      </td>
                      <td className="px-4 py-4">
                        {["CLIENTE", "USUARIO_EMPRESA"].includes(user.role) ? (
                          <PriceListBadge name={user.price_list_name} />
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge active={user.is_active} />
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className="flex justify-center"
                          title={user.is_self ? "Tu propia cuenta no puede deshabilitarse" : undefined}
                        >
                          <UserStatusSwitch
                            active={user.is_active}
                            disabled={user.is_self}
                            onClick={() =>
                              !user.is_self &&
                              setAction({
                                type: user.is_active ? "disable" : "enable",
                                user,
                              })
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-500">
                        {formatDate(user.last_login_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionIconButton
                            label="Editar usuario"
                            onClick={() => setModal({ mode: "edit", user })}
                            icon={<EditIcon className="h-5 w-5" />}
                          />

                          {!user.is_self && (
                            <ActionIconButton
                              label="Eliminar usuario"
                              onClick={() => setAction({ type: "delete", user })}
                              tone="danger"
                              icon={<DeleteIcon className="h-5 w-5" />}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-neutral-100 lg:hidden">
              {users.map((user) => (
                <article key={user.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                      {getInitials(user)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-neutral-900">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.is_self && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            Tú
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 break-all text-xs text-neutral-500">
                        {user.email}
                      </p>
                    </div>
                    <StatusBadge active={user.is_active} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-neutral-50 p-4 text-xs">
                    <div>
                      <p className="text-neutral-400">Perfil</p>
                      <p className="mt-1 font-semibold text-neutral-700">
                        {formatRole(user.role)}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-400">Último acceso</p>
                      <p className="mt-1 font-semibold text-neutral-700">
                        {formatDate(user.last_login_at)}
                      </p>
                    </div>
                    {user.company_name && (
                      <div className="col-span-2">
                        <p className="text-neutral-400">Empresa</p>
                        <p className="mt-1 font-semibold text-neutral-700">
                          {user.company_name}
                        </p>
                      </div>
                    )}
                    {["CLIENTE", "USUARIO_EMPRESA"].includes(user.role) && (
                      <div className="col-span-2">
                        <p className="text-neutral-400">Lista de precios</p>
                        <div className="mt-1">
                          <PriceListBadge name={user.price_list_name} />
                        </div>
                      </div>
                    )}
                    <div className="col-span-2 flex items-center justify-between border-t border-neutral-200 pt-3">
                      <div>
                        <p className="text-neutral-400">Acceso</p>
                        <p className="mt-1 font-semibold text-neutral-700">
                          {user.is_active ? "Habilitado" : "Deshabilitado"}
                        </p>
                      </div>
                      <div title={user.is_self ? "Tu propia cuenta no puede deshabilitarse" : undefined}>
                        <UserStatusSwitch
                          active={user.is_active}
                          disabled={user.is_self}
                          onClick={() =>
                            !user.is_self &&
                            setAction({
                              type: user.is_active ? "disable" : "enable",
                              user,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionIconButton
                      label="Editar usuario"
                      onClick={() => setModal({ mode: "edit", user })}
                      icon={<EditIcon className="h-5 w-5" />}
                    />
                    {!user.is_self && (
                      <ActionIconButton
                        label="Eliminar usuario"
                        onClick={() => setAction({ type: "delete", user })}
                        tone="danger"
                        icon={<DeleteIcon className="h-5 w-5" />}
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {!loading && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-4 sm:px-6">
            <p className="text-xs text-neutral-500">
              Página {pagination.page} de {pagination.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => loadUsers(pagination.page - 1)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => loadUsers(pagination.page + 1)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>

      <UserFormModal
        open={Boolean(modal)}
        mode={modal?.mode || "create"}
        user={modal?.user || null}
        roles={roles}
        companies={companies}
        priceLists={priceLists}
        onClose={() => setModal(null)}
        onSaved={() => loadUsers(pagination.page || 1)}
      />

      <ConfirmationModal
        action={action}
        busy={actionBusy}
        onClose={() => setAction(null)}
        onConfirm={handleConfirmedAction}
      />
    </main>
  );
}