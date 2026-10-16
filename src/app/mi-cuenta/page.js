"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthSession,
  getRoleLabel,
  updateStoredUser,
} from "@/services/auth.service";

import {
  createAccountAddress,
  createDocumentAccess,
  deleteAccountAddress,
  getAccount,
  getAccountAddresses,
  getAccountCompanies,
  getAccountDocuments,
  getAccountExclusiveProducts,
  getAccountOrders,
  updateAccount,
  updateAccountAddress,
  updateAccountCompany,
} from "@/services/account.service";

const normalizeRole = (role) =>
  String(role || "").trim().toUpperCase();

const formatMoney = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getInitials = (user) => {
  const first = String(user?.first_name || "").trim();
  const last = String(user?.last_name || "").trim();
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "LC";
};

const orderStatusLabel = (status) => {
  const map = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    PROCESSING: "En proceso",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };
  return map[String(status || "").toUpperCase()] || status || "—";
};

const paymentStatusLabel = (status) => {
  const map = {
    PENDING: "Pendiente",
    AWAITING_CONFIRMATION: "Esperando confirmación",
    AUTHORIZED: "Autorizado",
    PAID: "Pagado",
    FAILED: "Fallido",
    REFUNDED: "Reembolsado",
    CANCELLED: "Cancelado",
  };
  return map[String(status || "").toUpperCase()] || status || "—";
};

const documentStatusLabel = (status) => {
  const map = {
    PENDING: "Pendiente",
    PROCESSING: "Procesando",
    ISSUED: "Emitido",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado",
    CANCELLED: "Anulado",
    ERROR: "Error",
  };
  return map[String(status || "").toUpperCase()] || status || "—";
};

function InfoRow({ label, value }) {
  return (
    <div className="border-b border-neutral-100 py-4 last:border-b-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-medium text-neutral-900">
        {value || "—"}
      </p>
    </div>
  );
}

function SectionCard({ id, title, description, action, children }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.045)] sm:p-8">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h2 className="text-lg font-medium tracking-[-0.025em] text-neutral-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}

function ActionButton({ children, onClick, disabled = false, variant = "dark", type = "button" }) {
  const classes =
    variant === "light"
      ? "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
      : variant === "danger"
        ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
        : "bg-black text-white hover:bg-neutral-800";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-2.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      {children}
    </button>
  );
}

function Modal({ open, title, description, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-6 sm:px-8">
          <div>
            <h3 className="text-xl font-medium tracking-[-0.03em] text-neutral-950">{title}</h3>
            {description ? <p className="mt-2 text-sm text-neutral-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-lg text-neutral-500 transition hover:bg-neutral-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-6 sm:px-8">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {label}{required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
      />
    </label>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{text}</p>
    </div>
  );
}


const getProductImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const apiUrl = String(
    process.env.NEXT_PUBLIC_API_URL || ""
  ).replace(/\/$/, "");

  const baseUrl = apiUrl.replace(/\/api$/i, "");

  return `${baseUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

function ExclusiveProductCard({ product }) {
  const imageUrl = getProductImageUrl(product.image_url);

  return (
    <article className="rounded-2xl border border-neutral-100 bg-[#fbfaf8] p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[112px_1fr] sm:items-center">
        <div className="overflow-hidden rounded-2xl bg-neutral-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.image_alt || product.name}
              className="aspect-[4/5] h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center px-3 text-center text-[11px] text-neutral-400">
              Sin imagen
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            SKU {product.sku}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-neutral-950">
            {product.name}
          </h3>

          <div className="mt-3 inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-neutral-800">
            Descuento exclusivo cliente
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-neutral-400 line-through">
                {formatMoney(product.regular_price)}
              </p>
              <p className="mt-0.5 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                {formatMoney(product.final_price)}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-700">
                Ahorras {formatMoney(product.exclusive_savings)}
              </p>
              <p className="mt-1 text-[11px] text-neutral-400">
                {product.in_stock
                  ? `${product.available_web} ${Number(product.available_web) === 1 ? "unidad disponible" : "unidades disponibles"}`
                  : "Temporalmente sin stock"}
              </p>
            </div>

            <Link
              href={`/productos/${encodeURIComponent(product.slug)}`}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-medium !text-white transition hover:bg-neutral-800 hover:!text-white"
            >
              Ver producto <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

const emptyAddress = {
  label: "",
  recipient_name: "",
  rut: "",
  phone: "",
  street: "",
  street_number: "",
  apartment: "",
  commune: "",
  city: "Santiago",
  region: "Región Metropolitana",
  country: "Chile",
  postal_code: "",
  delivery_notes: "",
  is_default: false,
};

export default function MyAccountPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [exclusiveProducts, setExclusiveProducts] = useState([]);
  const [hasExclusivePricing, setHasExclusivePricing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone: "", rut: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const [addressOpen, setAddressOpen] = useState(false);
  const [addressEditingId, setAddressEditingId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addressSaving, setAddressSaving] = useState(false);

  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState({});
  const [companySaving, setCompanySaving] = useState(false);
  const [documentOpeningId, setDocumentOpeningId] = useState(null);

  const role = normalizeRole(user?.role);
  const isCompanyUser = role === "USUARIO_EMPRESA";

  const primaryCompany = useMemo(() => {
    const source = companies.length ? companies : Array.isArray(user?.companies) ? user.companies : [];
    return source.find((company) => company?.is_primary_contact === true) || source[0] || null;
  }, [companies, user]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      setError("");

      const accountResponse = await getAccount();
      if (!accountResponse?.success || !accountResponse?.user) {
        throw new Error("No fue posible cargar tu cuenta");
      }

      const currentUser = accountResponse.user;
      const currentRole = normalizeRole(currentUser.role);

      if (currentRole === "ADMIN") {
        router.replace("/admin");
        return;
      }

      if (currentRole !== "CLIENTE" && currentRole !== "USUARIO_EMPRESA") {
        clearAuthSession();
        router.replace("/login");
        return;
      }

      const requests = [
        getAccountAddresses(),
        getAccountOrders({ page: 1, limit: 20 }),
        getAccountDocuments({ page: 1, limit: 20 }),
        getAccountExclusiveProducts(),
      ];

      if (currentRole === "USUARIO_EMPRESA") {
        requests.push(getAccountCompanies());
      }

      const [
        addressesResponse,
        ordersResponse,
        documentsResponse,
        exclusiveResponse,
        companiesResponse,
      ] = await Promise.all(requests);

      setUser(currentUser);
      updateStoredUser(currentUser);
      setAddresses(Array.isArray(addressesResponse?.addresses) ? addressesResponse.addresses : []);
      setOrders(Array.isArray(ordersResponse?.orders) ? ordersResponse.orders : []);
      setDocuments(Array.isArray(documentsResponse?.documents) ? documentsResponse.documents : []);
      setExclusiveProducts(
        Array.isArray(exclusiveResponse?.products)
          ? exclusiveResponse.products
          : []
      );
      setHasExclusivePricing(
        exclusiveResponse?.has_exclusive_pricing === true
      );
      setCompanies(Array.isArray(companiesResponse?.companies) ? companiesResponse.companies : currentUser.companies || []);
    } catch (requestError) {
      if (requestError?.status === 401 || requestError?.status === 403) {
        clearAuthSession();
        router.replace("/login?redirect=/mi-cuenta");
        return;
      }
      setError(requestError?.message || "No fue posible cargar tu cuenta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/login");
    router.refresh();
  };

  const openProfile = () => {
    setProfileForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
      rut: user?.rut || "",
    });
    setProfileOpen(true);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setProfileSaving(true);
      const response = await updateAccount({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone || null,
        rut: profileForm.rut || null,
      });
      const updatedUser = response?.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        updateStoredUser(updatedUser);
      }
      setProfileOpen(false);
      showNotice("Perfil actualizado correctamente");
    } catch (saveError) {
      window.alert(saveError?.message || "No fue posible actualizar el perfil");
    } finally {
      setProfileSaving(false);
    }
  };

  const openNewAddress = () => {
    setAddressEditingId(null);
    setAddressForm({
      ...emptyAddress,
      recipient_name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
      rut: user?.rut || "",
      phone: user?.phone || "",
      is_default: addresses.length === 0,
    });
    setAddressOpen(true);
  };

  const openEditAddress = (address) => {
    setAddressEditingId(address.id);
    setAddressForm({
      ...emptyAddress,
      ...address,
      label: address.label || "",
      rut: address.rut || "",
      phone: address.phone || "",
      apartment: address.apartment || "",
      city: address.city || "",
      postal_code: address.postal_code || "",
      delivery_notes: address.delivery_notes || "",
    });
    setAddressOpen(true);
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    try {
      setAddressSaving(true);
      const payload = {
        ...addressForm,
        label: addressForm.label || null,
        rut: addressForm.rut || null,
        phone: addressForm.phone || null,
        apartment: addressForm.apartment || null,
        city: addressForm.city || null,
        postal_code: addressForm.postal_code || null,
        delivery_notes: addressForm.delivery_notes || null,
      };

      if (addressEditingId) {
        await updateAccountAddress(addressEditingId, payload);
      } else {
        await createAccountAddress(payload);
      }

      const refreshed = await getAccountAddresses();
      setAddresses(Array.isArray(refreshed?.addresses) ? refreshed.addresses : []);
      setAddressOpen(false);
      showNotice(addressEditingId ? "Dirección actualizada correctamente" : "Dirección creada correctamente");
    } catch (saveError) {
      window.alert(saveError?.message || "No fue posible guardar la dirección");
    } finally {
      setAddressSaving(false);
    }
  };

  const removeAddress = async (address) => {
    const confirmed = window.confirm(`¿Eliminar la dirección ${address.label || address.street}?`);
    if (!confirmed) return;

    try {
      await deleteAccountAddress(address.id);
      const refreshed = await getAccountAddresses();
      setAddresses(Array.isArray(refreshed?.addresses) ? refreshed.addresses : []);
      showNotice("Dirección eliminada correctamente");
    } catch (deleteError) {
      window.alert(deleteError?.message || "No fue posible eliminar la dirección");
    }
  };

  const openCompany = () => {
    if (!primaryCompany) return;
    setCompanyForm({
      trade_name: primaryCompany.trade_name || "",
      business_activity: primaryCompany.business_activity || "",
      billing_email: primaryCompany.billing_email || "",
      phone: primaryCompany.phone || "",
      address_line: primaryCompany.address_line || "",
      commune: primaryCompany.commune || "",
      city: primaryCompany.city || "",
      region: primaryCompany.region || "",
      country: primaryCompany.country || "Chile",
    });
    setCompanyOpen(true);
  };

  const saveCompany = async (event) => {
    event.preventDefault();
    if (!primaryCompany?.id) return;

    try {
      setCompanySaving(true);
      await updateAccountCompany(primaryCompany.id, {
        ...companyForm,
        trade_name: companyForm.trade_name || null,
        business_activity: companyForm.business_activity || null,
        billing_email: companyForm.billing_email || null,
        phone: companyForm.phone || null,
        address_line: companyForm.address_line || null,
        commune: companyForm.commune || null,
        city: companyForm.city || null,
        region: companyForm.region || null,
      });
      const refreshed = await getAccountCompanies();
      setCompanies(Array.isArray(refreshed?.companies) ? refreshed.companies : []);
      setCompanyOpen(false);
      showNotice("Empresa actualizada correctamente");
    } catch (saveError) {
      window.alert(saveError?.message || "No fue posible actualizar la empresa");
    } finally {
      setCompanySaving(false);
    }
  };

  const openDocument = async (document) => {
    try {
      setDocumentOpeningId(document.id);
      const response = await createDocumentAccess(document.id);
      const pdfPath = response?.data?.pdf_path;
      if (!pdfPath) throw new Error("No se recibió la ruta del documento");

      const baseUrl = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const url = /^https?:\/\//i.test(pdfPath) ? pdfPath : `${baseUrl}${pdfPath}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (documentError) {
      window.alert(documentError?.message || "No fue posible abrir el documento");
    } finally {
      setDocumentOpeningId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-[#f5f4f1] px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1180px]">
          <div className="h-44 animate-pulse rounded-[2rem] bg-white" />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-[1.75rem] bg-white" />
            <div className="h-80 animate-pulse rounded-[1.75rem] bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-[#f5f4f1] px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button type="button" onClick={loadAccount} className="mt-6 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <>
      {notice ? (
        <div className="fixed right-5 top-24 z-[90] rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-xl">
          {notice}
        </div>
      ) : null}

      <main className="min-h-[calc(100vh-72px)] bg-[#f5f4f1] px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <div className="mx-auto max-w-[1180px]">
          <section className="overflow-hidden rounded-[2rem] bg-black text-white shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
            <div className="grid gap-8 px-7 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg font-semibold tracking-[0.08em]">
                  {getInitials(user)}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                    {user.role_label || getRoleLabel(user.role)}
                  </p>
                  <h1 className="mt-2 truncate text-2xl font-medium tracking-[-0.035em] sm:text-3xl">
                    {user.first_name} {user.last_name}
                  </h1>
                  <p className="mt-2 truncate text-sm text-white/55">{user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link href="/" className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                  Ir a la tienda
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-100">
                  Cerrar sesión
                </button>
              </div>
            </div>
          </section>

          <nav className="mt-5 overflow-x-auto border-b border-black/10">
            <div className="flex min-w-max items-center gap-2 pb-3 text-sm text-neutral-600">
              <a href="#mi-perfil" className="rounded-full px-4 py-2 transition hover:bg-white hover:text-black">
                Mi perfil
              </a>
              <a href="#mis-pedidos" className="rounded-full px-4 py-2 transition hover:bg-white hover:text-black">
                {isCompanyUser ? "Pedidos de empresa" : "Mis pedidos"}
              </a>
              <a href={isCompanyUser ? "#mi-empresa" : "#direcciones"} className="rounded-full px-4 py-2 transition hover:bg-white hover:text-black">
                {isCompanyUser ? "Mi empresa" : "Direcciones"}
              </a>
              <a href="#documentos" className="rounded-full px-4 py-2 transition hover:bg-white hover:text-black">
                {isCompanyUser ? "Facturas y documentos" : "Boletas y documentos"}
              </a>
              {exclusiveProducts.length > 0 ? (
                <a
                  href="#productos-exclusivos"
                  className="ml-1 rounded-full bg-black px-5 py-2.5 font-medium !text-white transition hover:bg-neutral-800 hover:!text-white"
                >
                  Mis productos exclusivos
                </a>
              ) : null}
            </div>
          </nav>

          {exclusiveProducts.length > 0 ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <SectionCard
                id="productos-exclusivos"
                title="Mis productos exclusivos"
                description="Productos que hoy tienen un precio exclusivo asociado a tu cuenta."
              >
                <div className="space-y-4 pt-5">
                  {exclusiveProducts.map((product) => (
                    <ExclusiveProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                id="mi-perfil"
                title="Mi perfil"
                description="Datos asociados a tu cuenta Laminati."
                action={<ActionButton variant="light" onClick={openProfile}>Editar</ActionButton>}
              >
                <InfoRow label="Nombre" value={`${user.first_name || ""} ${user.last_name || ""}`.trim()} />
                <InfoRow label="Correo electrónico" value={user.email} />
                <InfoRow label="Teléfono" value={user.phone} />
                <InfoRow label="RUT" value={user.rut} />
              </SectionCard>
            </div>
          ) : (
            <div className="mt-6">
              <SectionCard
                id="mi-perfil"
                title="Mi perfil"
                description="Datos asociados a tu cuenta Laminati."
                action={<ActionButton variant="light" onClick={openProfile}>Editar</ActionButton>}
              >
                <InfoRow label="Nombre" value={`${user.first_name || ""} ${user.last_name || ""}`.trim()} />
                <InfoRow label="Correo electrónico" value={user.email} />
                <InfoRow label="Teléfono" value={user.phone} />
                <InfoRow label="RUT" value={user.rut} />
              </SectionCard>
            </div>
          )}

          {hasExclusivePricing && exclusiveProducts.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-black/5 bg-white px-5 py-4 text-sm text-neutral-500 shadow-sm">
              Tu cuenta posee condiciones comerciales especiales, pero actualmente no hay productos con un precio exclusivo mejor que el precio público vigente.
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {isCompanyUser ? (
              <SectionCard
                id="mi-empresa"
                title="Mi empresa"
                description="Información comercial vinculada a tu usuario."
                action={primaryCompany?.is_primary_contact ? <ActionButton variant="light" onClick={openCompany}>Editar</ActionButton> : null}
              >
                <InfoRow label="Razón social" value={primaryCompany?.legal_name} />
                <InfoRow label="Nombre de fantasía" value={primaryCompany?.trade_name} />
                <InfoRow label="RUT empresa" value={primaryCompany?.rut} />
                <InfoRow label="Giro" value={primaryCompany?.business_activity} />
                <InfoRow label="Correo facturación" value={primaryCompany?.billing_email} />
                <InfoRow
                  label="Dirección"
                  value={[primaryCompany?.address_line, primaryCompany?.commune, primaryCompany?.city].filter(Boolean).join(", ")}
                />
              </SectionCard>
            ) : (
              <SectionCard
                id="direcciones"
                title="Direcciones"
                description="Administra tus direcciones guardadas."
                action={<ActionButton onClick={openNewAddress}>Nueva dirección</ActionButton>}
              >
                {addresses.length === 0 ? (
                  <EmptyState title="Aún no tienes direcciones" text="Agrega una dirección para tenerla disponible en tus próximas compras." />
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {addresses.map((address) => (
                      <div key={address.id} className="py-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-neutral-950">{address.label || "Dirección"}</p>
                              {address.is_default ? (
                                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Predeterminada</span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-neutral-600">
                              {address.street} {address.street_number}{address.apartment ? `, ${address.apartment}` : ""}
                              <br />
                              {address.commune}{address.city ? `, ${address.city}` : ""}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <ActionButton variant="light" onClick={() => openEditAddress(address)}>Editar</ActionButton>
                            <ActionButton variant="danger" onClick={() => removeAddress(address)}>Eliminar</ActionButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            <SectionCard
              id="mis-pedidos"
              title={isCompanyUser ? "Pedidos de empresa" : "Mis pedidos"}
              description="Historial de compras asociado a tu cuenta."
            >
              {orders.length === 0 ? (
                <EmptyState title="Todavía no tienes pedidos asociados" text="Las próximas compras realizadas con tu cuenta aparecerán automáticamente aquí." />
              ) : (
                <div className="divide-y divide-neutral-100">
                  {orders.map((order) => (
                    <div key={order.id} className="py-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">{order.order_number}</p>
                          <p className="mt-1 text-xs text-neutral-500">{formatDate(order.created_at)} · {order.document_type || "Documento pendiente"}</p>
                          {order.access_scope === "COMPANY" ? (
                            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Pedido empresa</p>
                          ) : null}
                        </div>
                        <p className="text-base font-semibold text-neutral-950">{formatMoney(order.total)}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-700">{orderStatusLabel(order.status)}</span>
                        <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-700">{paymentStatusLabel(order.payment_status)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="mt-6">
            <SectionCard
              id="documentos"
              title={isCompanyUser ? "Facturas y documentos" : "Boletas y documentos"}
              description="Documentos tributarios asociados a tus compras."
            >
              {documents.length === 0 ? (
                <EmptyState title="No hay documentos disponibles" text="Cuando una boleta o factura quede emitida y aceptada aparecerá en esta sección." />
              ) : (
                <div className="divide-y divide-neutral-100">
                  {documents.map((document) => (
                    <div key={document.id} className="py-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">
                            {document.document_type === "FACTURA" ? "Factura" : "Boleta"}{document.folio ? ` N° ${document.folio}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">Pedido {document.order_number} · {formatDate(document.issued_at || document.created_at)}</p>
                          <p className="mt-2 text-xs font-medium text-neutral-700">{documentStatusLabel(document.status)} · {formatMoney(document.total_amount)}</p>
                        </div>
                        {document.pdf_available ? (
                          <ActionButton disabled={documentOpeningId === document.id} onClick={() => openDocument(document)}>
                            {documentOpeningId === document.id ? "Abriendo..." : "Ver PDF"}
                          </ActionButton>
                        ) : (
                          <span className="rounded-full bg-neutral-100 px-3 py-2 text-xs text-neutral-500">PDF pendiente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </main>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Editar mi perfil" description="El correo electrónico y el rol no se modifican desde esta sección.">
        <form onSubmit={saveProfile} className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre" value={profileForm.first_name} onChange={(value) => setProfileForm((current) => ({ ...current, first_name: value }))} required />
          <Field label="Apellido" value={profileForm.last_name} onChange={(value) => setProfileForm((current) => ({ ...current, last_name: value }))} required />
          <Field label="Teléfono" value={profileForm.phone} onChange={(value) => setProfileForm((current) => ({ ...current, phone: value }))} />
          <Field label="RUT" value={profileForm.rut} onChange={(value) => setProfileForm((current) => ({ ...current, rut: value }))} />
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <ActionButton variant="light" onClick={() => setProfileOpen(false)}>Cancelar</ActionButton>
            <ActionButton type="submit" disabled={profileSaving}>{profileSaving ? "Guardando..." : "Guardar cambios"}</ActionButton>
          </div>
        </form>
      </Modal>

      <Modal open={addressOpen} onClose={() => setAddressOpen(false)} title={addressEditingId ? "Editar dirección" : "Nueva dirección"} description="Esta información quedará disponible para tus próximas compras.">
        <form onSubmit={saveAddress} className="grid gap-5 sm:grid-cols-2">
          <Field label="Etiqueta" value={addressForm.label} onChange={(value) => setAddressForm((current) => ({ ...current, label: value }))} placeholder="Casa, oficina..." />
          <Field label="Destinatario" value={addressForm.recipient_name} onChange={(value) => setAddressForm((current) => ({ ...current, recipient_name: value }))} required />
          <Field label="RUT" value={addressForm.rut} onChange={(value) => setAddressForm((current) => ({ ...current, rut: value }))} />
          <Field label="Teléfono" value={addressForm.phone} onChange={(value) => setAddressForm((current) => ({ ...current, phone: value }))} />
          <Field label="Calle" value={addressForm.street} onChange={(value) => setAddressForm((current) => ({ ...current, street: value }))} required />
          <Field label="Número" value={addressForm.street_number} onChange={(value) => setAddressForm((current) => ({ ...current, street_number: value }))} required />
          <Field label="Depto / oficina" value={addressForm.apartment} onChange={(value) => setAddressForm((current) => ({ ...current, apartment: value }))} />
          <Field label="Comuna" value={addressForm.commune} onChange={(value) => setAddressForm((current) => ({ ...current, commune: value }))} required />
          <Field label="Ciudad" value={addressForm.city} onChange={(value) => setAddressForm((current) => ({ ...current, city: value }))} />
          <Field label="Región" value={addressForm.region} onChange={(value) => setAddressForm((current) => ({ ...current, region: value }))} required />
          <Field label="País" value={addressForm.country} onChange={(value) => setAddressForm((current) => ({ ...current, country: value }))} required />
          <Field label="Código postal" value={addressForm.postal_code} onChange={(value) => setAddressForm((current) => ({ ...current, postal_code: value }))} />
          <label className="sm:col-span-2 block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Indicaciones</span>
            <textarea value={addressForm.delivery_notes || ""} onChange={(event) => setAddressForm((current) => ({ ...current, delivery_notes: event.target.value }))} rows={3} className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-neutral-900" />
          </label>
          <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            <input type="checkbox" checked={Boolean(addressForm.is_default)} onChange={(event) => setAddressForm((current) => ({ ...current, is_default: event.target.checked }))} />
            Usar como dirección predeterminada
          </label>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <ActionButton variant="light" onClick={() => setAddressOpen(false)}>Cancelar</ActionButton>
            <ActionButton type="submit" disabled={addressSaving}>{addressSaving ? "Guardando..." : "Guardar dirección"}</ActionButton>
          </div>
        </form>
      </Modal>

      <Modal open={companyOpen} onClose={() => setCompanyOpen(false)} title="Editar empresa" description="La razón social, el RUT y el vínculo con Relbase están protegidos.">
        <form onSubmit={saveCompany} className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre de fantasía" value={companyForm.trade_name || ""} onChange={(value) => setCompanyForm((current) => ({ ...current, trade_name: value }))} />
          <Field label="Giro" value={companyForm.business_activity || ""} onChange={(value) => setCompanyForm((current) => ({ ...current, business_activity: value }))} />
          <Field label="Correo facturación" type="email" value={companyForm.billing_email || ""} onChange={(value) => setCompanyForm((current) => ({ ...current, billing_email: value }))} />
          <Field label="Teléfono" value={companyForm.phone || ""} onChange={(value) => setCompanyForm((current) => ({ ...current, phone: value }))} />
          <Field label="Dirección" value={companyForm.address_line || ""} onChange={(value) => setCompanyForm((current) => ({ ...current, address_line: value }))} />
          <Field label="Comuna" value={companyForm.commune || ""} onChange={(value) => setCompanyForm((current) => ({ ...current, commune: value }))} />
          <Field label="Ciudad" value={companyForm.city || ""} onChange={(value) => setCompanyForm((current) => ({ ...current, city: value }))} />
          <Field label="Región" value={companyForm.region || ""} onChange={(value) => setCompanyForm((current) => ({ ...current, region: value }))} />
          <Field label="País" value={companyForm.country || "Chile"} onChange={(value) => setCompanyForm((current) => ({ ...current, country: value }))} />
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <ActionButton variant="light" onClick={() => setCompanyOpen(false)}>Cancelar</ActionButton>
            <ActionButton type="submit" disabled={companySaving}>{companySaving ? "Guardando..." : "Guardar empresa"}</ActionButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
