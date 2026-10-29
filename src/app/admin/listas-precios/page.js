"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import ConfirmDialog from "@/components/admin/price-lists/ConfirmDialog";
import PriceListFormModal from "@/components/admin/price-lists/PriceListFormModal";
import PriceListRuleModal from "@/components/admin/price-lists/PriceListRuleModal";

import {
  deleteAdminPriceList,
  deleteAdminPriceListRule,
  getAdminPriceList,
  listAdminPriceListCollections,
  listAdminPriceListProducts,
  listAdminPriceLists,
} from "@/services/adminPriceLists.service";

const money = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "Sin límite";

  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);

  if (!year || !month || !day) return raw;

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const discountLabel = (rule) =>
  rule?.discount_type === "FIXED_AMOUNT"
    ? money(rule.discount_value)
    : `${Number(rule?.discount_value || 0).toLocaleString("es-CL", {
        maximumFractionDigits: 2,
      })}%`;

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
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

function DeleteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function RefreshIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 6v5h-5" />
      <path d="M4 18v-5h5" />
      <path d="M18.5 9A7 7 0 0 0 6 6.5L4 9M5.5 15A7 7 0 0 0 18 17.5l2-2.5" />
    </svg>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-neutral-400"
        }`}
      />
      {active ? "Activa" : "Inactiva"}
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

function EmptyState({ title, text }) {
  return (
    <div className="rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-neutral-700">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-neutral-500">
        {text}
      </p>
    </div>
  );
}

export default function AdminPriceListsPage() {
  const [priceLists, setPriceLists] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedPriceList, setSelectedPriceList] = useState(null);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);

  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [formModal, setFormModal] = useState({
    open: false,
    mode: "create",
    priceList: null,
  });

  const [ruleModal, setRuleModal] = useState({
    open: false,
    mode: "create",
    scope: "PRODUCT",
    rule: null,
  });

  const [confirm, setConfirm] = useState({
    open: false,
    type: "",
    target: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadLists = useCallback(async (preferredId = "") => {
    try {
      setLoadingLists(true);
      setPageError("");

      const response = await listAdminPriceLists();
      const rows = Array.isArray(response?.data) ? response.data : [];
      setPriceLists(rows);

      const nextId =
        preferredId && rows.some((item) => item.id === preferredId)
          ? preferredId
          : selectedId && rows.some((item) => item.id === selectedId)
            ? selectedId
            : rows[0]?.id || "";

      setSelectedId(nextId);
      return nextId;
    } catch (error) {
      setPageError(error?.message || "No fue posible cargar las listas de precios.");
      return "";
    } finally {
      setLoadingLists(false);
    }
  }, [selectedId]);

  const loadDetail = useCallback(async (priceListId) => {
    if (!priceListId) {
      setSelectedPriceList(null);
      return;
    }

    try {
      setLoadingDetail(true);
      setPageError("");

      const response = await getAdminPriceList(priceListId);
      setSelectedPriceList(response?.data || null);
    } catch (error) {
      setPageError(error?.message || "No fue posible cargar el detalle de la lista.");
      setSelectedPriceList(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const loadCatalogOptions = useCallback(async () => {
    try {
      setLoadingCatalog(true);

      const [productsResponse, collectionsResponse] = await Promise.all([
        listAdminPriceListProducts(),
        listAdminPriceListCollections(),
      ]);

      setProducts(
        Array.isArray(productsResponse?.products) ? productsResponse.products : []
      );
      setCollections(
        Array.isArray(collectionsResponse?.collections)
          ? collectionsResponse.collections
          : []
      );
    } catch (error) {
      console.error("No fue posible cargar productos/colecciones:", error);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
    loadCatalogOptions();
  }, []);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const refreshAll = useCallback(
    async (preferredId = selectedId) => {
      const nextId = await loadLists(preferredId);
      if (nextId) {
        await loadDetail(nextId);
      }
    },
    [loadLists, loadDetail, selectedId]
  );

  const filteredLists = useMemo(() => {
    const term = search.trim().toLowerCase();

    return priceLists.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.description].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && item.is_active) ||
        (statusFilter === "INACTIVE" && !item.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [priceLists, search, statusFilter]);

  const metrics = useMemo(() => {
    return {
      total: priceLists.length,
      active: priceLists.filter((item) => item.is_active).length,
      rules: priceLists.reduce(
        (sum, item) => sum + Number(item.rules_count || 0),
        0
      ),
      users: priceLists.reduce(
        (sum, item) => sum + Number(item.assigned_users_count || 0),
        0
      ),
    };
  }, [priceLists]);

  const rules = Array.isArray(selectedPriceList?.rules)
    ? selectedPriceList.rules
    : [];
  const assignedUsers = Array.isArray(selectedPriceList?.assigned_users)
    ? selectedPriceList.assigned_users
    : [];

  const openCreateList = () => {
    setFormModal({ open: true, mode: "create", priceList: null });
  };

  const openEditList = () => {
    if (!selectedPriceList) return;
    setFormModal({
      open: true,
      mode: "edit",
      priceList: selectedPriceList,
    });
  };

  const openCreateRule = (scope) => {
    if (!selectedPriceList || loadingCatalog) return;

    setRuleModal({
      open: true,
      mode: "create",
      scope,
      rule: null,
    });
  };

  const openEditRule = (rule) => {
    setRuleModal({
      open: true,
      mode: "edit",
      scope: rule.scope_type,
      rule,
    });
  };

  const handleListSaved = async (saved) => {
    setMessage("Lista de precios guardada correctamente.");
    await refreshAll(saved?.id || selectedId);
  };

  const handleRuleSaved = async () => {
    setMessage("Regla de descuento guardada correctamente.");
    await refreshAll(selectedId);
  };

  const requestDeleteList = () => {
    if (!selectedPriceList) return;
    setConfirm({
      open: true,
      type: "list",
      target: selectedPriceList,
    });
  };

  const requestDeleteRule = (rule) => {
    setConfirm({
      open: true,
      type: "rule",
      target: rule,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirm.target) return;

    try {
      setConfirmLoading(true);
      setPageError("");

      if (confirm.type === "list") {
        await deleteAdminPriceList(confirm.target.id);
        setMessage("Lista de precios eliminada correctamente.");
        setConfirm({ open: false, type: "", target: null });
        setSelectedPriceList(null);
        setSelectedId("");
        await loadLists("");
      } else {
        await deleteAdminPriceListRule(selectedId, confirm.target.id);
        setMessage("Regla eliminada correctamente.");
        setConfirm({ open: false, type: "", target: null });
        await refreshAll(selectedId);
      }
    } catch (error) {
      setPageError(error?.message || "No fue posible completar la eliminación.");
      setConfirm({ open: false, type: "", target: null });
    } finally {
      setConfirmLoading(false);
    }
  };

  const selectedRuleLabel = (rule) =>
    rule.scope_type === "PRODUCT"
      ? `${rule.product_sku || "Sin SKU"} · ${rule.product_name || "Producto"}`
      : rule.collection_name || "Colección";

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <header className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.05)]">
          <div className="h-[3px] bg-gradient-to-r from-red-400 via-pink-400 to-violet-600" />
          <div className="flex flex-col gap-5 px-6 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Laminati · Backoffice
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black">
              Listas de precios
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              Crea descuentos por producto o colección y administra las listas que luego podrás asignar a cada cliente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refreshAll()}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <RefreshIcon className="h-4 w-4" />
              Actualizar
            </button>

            <button
              type="button"
              onClick={openCreateList}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <PlusIcon className="h-4 w-4" />
              Nueva lista
            </button>
          </div>
                  </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Listas"
            value={metrics.total}
            caption="Condiciones comerciales creadas"
          />
          <MetricCard
            label="Activas"
            value={metrics.active}
            caption="Disponibles para asignación"
          />
          <MetricCard
            label="Reglas"
            value={metrics.rules}
            caption="Productos y colecciones configurados"
          />
          <MetricCard
            label="Usuarios"
            value={metrics.users}
            caption="Asignaciones actuales"
          />
        </section>

        {(pageError || message) && (
          <div className="mt-5 space-y-2">
            {pageError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pageError}
              </div>
            )}
            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}
          </div>
        )}

        <section className="mt-5 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar lista por nombre o descripción..."
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
            >
              <option value="ALL">Todas las listas</option>
              <option value="ACTIVE">Solo activas</option>
              <option value="INACTIVE">Solo inactivas</option>
            </select>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Listas creadas
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-800">
                  {filteredLists.length} resultado(s)
                </p>
              </div>
            </div>

            {loadingLists ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-28 animate-pulse rounded-2xl bg-neutral-100"
                  />
                ))}
              </div>
            ) : filteredLists.length === 0 ? (
              <EmptyState
                title="No hay listas para mostrar"
                text="Crea una nueva lista o modifica los filtros de búsqueda."
              />
            ) : (
              <div className="space-y-2">
                {filteredLists.map((item) => {
                  const active = item.id === selectedId;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-black bg-black text-white shadow-sm"
                          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {item.name}
                          </p>
                          <p
                            className={`mt-1 line-clamp-2 text-xs leading-5 ${
                              active ? "text-white/65" : "text-neutral-500"
                            }`}
                          >
                            {item.description || "Sin descripción"}
                          </p>
                        </div>

                        <span
                          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                            item.is_active ? "bg-emerald-500" : "bg-neutral-300"
                          }`}
                        />
                      </div>

                      <div
                        className={`mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium ${
                          active ? "text-white/70" : "text-neutral-500"
                        }`}
                      >
                        <span>{item.rules_count || 0} reglas</span>
                        <span>{item.assigned_users_count || 0} usuarios</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="min-w-0 rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6 lg:p-7">
            {loadingDetail ? (
              <div className="space-y-4">
                <div className="h-8 w-64 animate-pulse rounded-xl bg-neutral-100" />
                <div className="h-20 animate-pulse rounded-2xl bg-neutral-100" />
                <div className="h-56 animate-pulse rounded-2xl bg-neutral-100" />
              </div>
            ) : !selectedPriceList ? (
              <EmptyState
                title="Selecciona una lista"
                text="El detalle de reglas, vigencia y usuarios asignados aparecerá aquí."
              />
            ) : (
              <>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black sm:text-3xl">
                        {selectedPriceList.name}
                      </h2>
                      <StatusBadge active={selectedPriceList.is_active} />
                    </div>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                      {selectedPriceList.description || "Sin descripción."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
                      <span className="rounded-full bg-neutral-100 px-3 py-1.5">
                        Desde: {formatDate(selectedPriceList.valid_from)}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1.5">
                        Hasta: {formatDate(selectedPriceList.valid_until)}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1.5">
                        {rules.length} reglas
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1.5">
                        {assignedUsers.length} usuarios
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={openEditList}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <EditIcon className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={requestDeleteList}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <DeleteIcon className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="mt-7 border-t border-neutral-100 pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                        Reglas de descuento
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                        Productos y colecciones
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        Una regla específica de producto tendrá prioridad sobre una regla de colección cuando activemos el motor de precios.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openCreateRule("PRODUCT")}
                        disabled={loadingCatalog}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Producto
                      </button>
                      <button
                        type="button"
                        onClick={() => openCreateRule("COLLECTION")}
                        disabled={loadingCatalog}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Colección
                      </button>
                    </div>
                  </div>

                  {rules.length === 0 ? (
                    <div className="mt-4">
                      <EmptyState
                        title="Esta lista todavía no tiene reglas"
                        text="Agrega productos individuales o una colección completa y define el descuento correspondiente."
                      />
                    </div>
                  ) : (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200">
                      <div className="hidden grid-cols-[120px_minmax(0,1fr)_150px_110px_100px] gap-3 bg-neutral-950 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white md:grid">
                        <span>Tipo</span>
                        <span>Producto / colección</span>
                        <span>Descuento</span>
                        <span>Estado</span>
                        <span className="text-right">Acciones</span>
                      </div>

                      <div className="divide-y divide-neutral-100">
                        {rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="grid gap-3 px-4 py-4 md:grid-cols-[120px_minmax(0,1fr)_150px_110px_100px] md:items-center"
                          >
                            <div>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                                  rule.scope_type === "PRODUCT"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-violet-50 text-violet-700"
                                }`}
                              >
                                {rule.scope_type === "PRODUCT" ? "Producto" : "Colección"}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-neutral-900">
                                {selectedRuleLabel(rule)}
                              </p>
                              {rule.scope_type === "PRODUCT" && (
                                <p className="mt-0.5 truncate text-xs text-neutral-400">
                                  Precio base {money(rule.product_base_price)}
                                </p>
                              )}
                              {rule.scope_type === "COLLECTION" && rule.collection_brand_name && (
                                <p className="mt-0.5 truncate text-xs text-neutral-400">
                                  {rule.collection_brand_name}
                                </p>
                              )}
                            </div>

                            <div>
                              <span className="text-base font-semibold text-neutral-900">
                                {discountLabel(rule)}
                              </span>
                              <span className="ml-1 text-[10px] text-neutral-400">
                                {rule.discount_type === "PERCENTAGE" ? "descuento" : "menos"}
                              </span>
                            </div>

                            <div>
                              <StatusBadge active={rule.is_active} />
                            </div>

                            <div className="flex justify-start gap-2 md:justify-end">
                              <button
                                type="button"
                                onClick={() => openEditRule(rule)}
                                title="Editar regla"
                                aria-label="Editar regla"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50"
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteRule(rule)}
                                title="Eliminar regla"
                                aria-label="Eliminar regla"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-500 transition hover:bg-red-50"
                              >
                                <DeleteIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-7 border-t border-neutral-100 pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                        Usuarios asignados
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                        {assignedUsers.length} usuario(s)
                      </h3>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Se administra desde Usuarios en la etapa 3
                    </span>
                  </div>

                  {assignedUsers.length === 0 ? (
                    <p className="mt-3 text-sm text-neutral-500">
                      Esta lista todavía no está asignada a ningún usuario.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {assignedUsers.map((user) => (
                        <div
                          key={user.user_id}
                          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                        >
                          <p className="truncate text-sm font-semibold text-neutral-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-neutral-500">
                            {user.email}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                            {user.role || "Usuario"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <PriceListFormModal
        open={formModal.open}
        mode={formModal.mode}
        priceList={formModal.priceList}
        onClose={() =>
          setFormModal({ open: false, mode: "create", priceList: null })
        }
        onSaved={handleListSaved}
      />

      <PriceListRuleModal
        open={ruleModal.open}
        mode={ruleModal.mode}
        scope={ruleModal.scope}
        rule={ruleModal.rule}
        priceListId={selectedId}
        products={products}
        collections={collections}
        existingRules={rules}
        onClose={() =>
          setRuleModal({
            open: false,
            mode: "create",
            scope: "PRODUCT",
            rule: null,
          })
        }
        onSaved={handleRuleSaved}
      />

      <ConfirmDialog
        open={confirm.open}
        title={
          confirm.type === "list"
            ? `Eliminar ${confirm.target?.name || "lista"}`
            : "Eliminar regla"
        }
        message={
          confirm.type === "list"
            ? "Esta acción eliminará también sus reglas. Si la lista está asignada a usuarios, el backend bloqueará la eliminación hasta que sea desasignada."
            : `Se eliminará la regla ${
                confirm.target ? selectedRuleLabel(confirm.target) : "seleccionada"
              } de esta lista.`
        }
        confirmLabel="Eliminar"
        danger
        loading={confirmLoading}
        onClose={() =>
          setConfirm({ open: false, type: "", target: null })
        }
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
