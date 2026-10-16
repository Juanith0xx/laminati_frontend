"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listAdminContacts,
  updateAdminContactStatus,
  listAdminContactReplies,
  sendAdminContactReply,
} from "@/services/adminContacts.service";

const SUBJECT_LABELS = {
  QUOTE: "Cotización",
  PRODUCT: "Consulta de producto",
  STOCK: "Disponibilidad / stock",
  BUSINESS: "Venta empresa",
  PROJECT: "Proyecto",
  OTHER: "Otro",
};

const STATUS_LABELS = {
  NEW: "Nuevo",
  READ: "Leído",
  RESPONDED: "Respondido",
  CLOSED: "Cerrado",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getInitials(contact) {
  const first = String(contact?.first_name || "").trim();
  const last = String(contact?.last_name || "").trim();
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "C";
}

function StatusBadge({ status }) {
  const className = {
    NEW: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    READ: "bg-blue-50 text-blue-700 ring-blue-200",
    RESPONDED: "bg-violet-50 text-violet-700 ring-violet-200",
    CLOSED: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  }[status] || "bg-neutral-100 text-neutral-600 ring-neutral-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${className}`}
    >
      {STATUS_LABELS[status] || status}
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

function EyeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function getDefaultReplySubject(contact) {
  const reason =
    SUBJECT_LABELS[contact?.subject] ||
    "Consulta";

  return `Re: Laminati · ${reason}`;
}

function DetailModal({
  contact,
  busy,
  onClose,
  onStatusChange,
  onReplySent,
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replySuccess, setReplySuccess] = useState("");
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  const contactId = contact?.id || null;

  useEffect(() => {
    setReplyOpen(false);
    setReplyMessage("");
    setReplyError("");
    setReplySuccess("");
    setReplies([]);

    if (!contactId) {
      setReplySubject("");
      setRepliesLoading(false);
      return;
    }

    setReplySubject(
      getDefaultReplySubject(contact)
    );

    const controller =
      new AbortController();

    const loadReplies = async () => {
      try {
        setRepliesLoading(true);

        const response =
          await listAdminContactReplies(
            contactId,
            {
              signal:
                controller.signal,
            }
          );

        setReplies(
          Array.isArray(
            response?.data
          )
            ? response.data
            : []
        );
      } catch (requestError) {
        if (
          requestError?.name ===
          "AbortError"
        ) {
          return;
        }

        setReplyError(
          requestError?.message ||
            "No fue posible cargar el historial de respuestas."
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setRepliesLoading(false);
        }
      }
    };

    loadReplies();

    return () => {
      controller.abort();
    };
  }, [contactId]);

  if (!contact) return null;

  const nextActions = [];

  if (contact.status === "READ") {
    nextActions.push({
      status: "RESPONDED",
      label: "Marcar respondido",
    });
  }

  if (
    contact.status ===
    "RESPONDED"
  ) {
    nextActions.push({
      status: "CLOSED",
      label: "Cerrar consulta",
    });
  }

  if (
    contact.status ===
    "CLOSED"
  ) {
    nextActions.push({
      status: "READ",
      label: "Reabrir consulta",
    });
  }

  const handleSendReply =
    async (event) => {
      event.preventDefault();

      const subject =
        String(
          replySubject || ""
        ).trim();

      const message =
        String(
          replyMessage || ""
        ).trim();

      if (
        subject.length < 2
      ) {
        setReplyError(
          "Ingresa un asunto para la respuesta."
        );
        return;
      }

      if (
        message.length < 2
      ) {
        setReplyError(
          "Escribe el mensaje que deseas enviar."
        );
        return;
      }

      try {
        setReplyBusy(true);
        setReplyError("");
        setReplySuccess("");

        const response =
          await sendAdminContactReply(
            contact.id,
            {
              subject,
              message,
            }
          );

        const sentReply =
          response?.data?.reply ||
          null;

        const updatedContact =
          response?.data?.contact ||
          null;

        if (sentReply) {
          setReplies(
            (current) => [
              ...current,
              sentReply,
            ]
          );
        }

        if (
          updatedContact &&
          onReplySent
        ) {
          await onReplySent(
            updatedContact
          );
        }

        setReplyMessage("");
        setReplyOpen(false);
        setReplySuccess(
          "Respuesta enviada correctamente."
        );
      } catch (requestError) {
        setReplyError(
          requestError?.message ||
            "No fue posible enviar la respuesta."
        );
      } finally {
        setReplyBusy(false);
      }
    };

  const modalBusy =
    busy || replyBusy;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={
          modalBusy
            ? undefined
            : onClose
        }
      />

      <section className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Laminati · Contactos
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-black">
              {contact.first_name}{" "}
              {contact.last_name}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {SUBJECT_LABELS[
                contact.subject
              ] || contact.subject}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={modalBusy}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={
                contact.status
              }
            />
            <span className="text-xs text-neutral-400">
              Recibido{" "}
              {formatDate(
                contact.created_at
              )}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Correo
              </p>
              <a
                href={`mailto:${contact.email}`}
                className="mt-1 block break-all text-sm font-semibold text-neutral-900 hover:underline"
              >
                {contact.email}
              </a>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Teléfono
              </p>
              <a
                href={`tel:${contact.phone}`}
                className="mt-1 block text-sm font-semibold text-neutral-900 hover:underline"
              >
                {contact.phone}
              </a>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4 sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Empresa
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {contact.company_name ||
                  "No informada"}
              </p>
            </div>
          </div>

          <div className="rounded-[22px] border border-neutral-200 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Mensaje
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
              {contact.message}
            </p>
          </div>

          {(repliesLoading ||
            replies.length > 0) && (
            <div className="rounded-[22px] border border-neutral-200 bg-neutral-50/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Historial
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    Respuestas enviadas
                  </p>
                </div>
                {!repliesLoading && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
                    {replies.length}
                  </span>
                )}
              </div>

              {repliesLoading ? (
                <p className="mt-4 text-sm text-neutral-500">
                  Cargando respuestas...
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {replies.map(
                    (reply) => (
                      <article
                        key={reply.id}
                        className="rounded-2xl border border-neutral-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-neutral-900">
                              {reply.admin_first_name ||
                              reply.admin_last_name
                                ? `${reply.admin_first_name || ""} ${reply.admin_last_name || ""}`.trim()
                                : "Laminati"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-neutral-400">
                              {formatDate(
                                reply.sent_at ||
                                  reply.created_at
                              )}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${
                              reply.delivery_status ===
                              "SENT"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : reply.delivery_status ===
                                    "FAILED"
                                  ? "bg-red-50 text-red-700 ring-red-200"
                                  : "bg-amber-50 text-amber-700 ring-amber-200"
                            }`}
                          >
                            {reply.delivery_status ===
                            "SENT"
                              ? "Enviado"
                              : reply.delivery_status ===
                                  "FAILED"
                                ? "Fallido"
                                : "Pendiente"}
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-semibold text-neutral-800">
                          {reply.subject}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                          {reply.message}
                        </p>

                        {reply.delivery_status ===
                          "FAILED" &&
                          reply.error_message && (
                            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                              {
                                reply.error_message
                              }
                            </p>
                          )}
                      </article>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {replySuccess && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {replySuccess}
            </div>
          )}

          {replyError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {replyError}
            </div>
          )}

          {replyOpen &&
            contact.status !==
              "CLOSED" && (
              <form
                onSubmit={
                  handleSendReply
                }
                className="rounded-[22px] border border-black/10 bg-[#faf9f7] p-5"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Responder
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-neutral-950">
                    Enviar respuesta desde
                    Laminati
                  </h3>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-neutral-700">
                      Para
                    </span>
                    <input
                      value={
                        contact.email
                      }
                      disabled
                      className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3.5 text-sm text-neutral-500 outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-neutral-700">
                      Asunto
                    </span>
                    <input
                      value={
                        replySubject
                      }
                      onChange={(
                        event
                      ) =>
                        setReplySubject(
                          event.target
                            .value
                        )
                      }
                      maxLength={255}
                      disabled={
                        replyBusy
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black disabled:opacity-60"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-neutral-700">
                      Mensaje
                    </span>
                    <textarea
                      value={
                        replyMessage
                      }
                      onChange={(
                        event
                      ) =>
                        setReplyMessage(
                          event.target
                            .value
                        )
                      }
                      maxLength={5000}
                      rows={7}
                      disabled={
                        replyBusy
                      }
                      placeholder="Escribe aquí la respuesta para el cliente..."
                      className="mt-2 w-full resize-y rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-300 focus:border-black disabled:opacity-60"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyOpen(
                        false
                      );
                      setReplyError(
                        ""
                      );
                    }}
                    disabled={
                      replyBusy
                    }
                    className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-white disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      replyBusy ||
                      !String(
                        replyMessage ||
                          ""
                      ).trim()
                    }
                    className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {replyBusy
                      ? "Enviando..."
                      : "Enviar respuesta"}
                  </button>
                </div>
              </form>
            )}

          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {contact.status !==
              "CLOSED" ? (
                <button
                  type="button"
                  onClick={() => {
                    setReplyOpen(
                      (current) =>
                        !current
                    );
                    setReplyError(
                      ""
                    );
                    setReplySuccess(
                      ""
                    );
                  }}
                  disabled={
                    modalBusy
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  {replyOpen
                    ? "Ocultar respuesta"
                    : "Responder"}
                </button>
              ) : (
                <p className="text-xs text-neutral-400">
                  Reabre la consulta para
                  enviar una nueva
                  respuesta.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {nextActions.map(
                (action) => (
                  <button
                    key={
                      action.status
                    }
                    type="button"
                    disabled={
                      modalBusy
                    }
                    onClick={() =>
                      onStatusChange(
                        action.status
                      )
                    }
                    className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy
                      ? "Actualizando..."
                      : action.label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    new: 0,
    read: 0,
    responded: 0,
    closed: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    subject: "ALL",
  });
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadContacts = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");

        const response = await listAdminContacts({
          ...filters,
          page,
          limit: 20,
        });

        setContacts(response?.data || []);
        setSummary(
          response?.summary || {
            total: 0,
            new: 0,
            read: 0,
            responded: 0,
            closed: 0,
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
            "No fue posible cargar las consultas."
        );
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadContacts(1);
  }, [loadContacts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((previous) => ({
        ...previous,
        search: searchInput.trim(),
      }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const statusOptions = useMemo(
    () => Object.entries(STATUS_LABELS),
    []
  );

  const subjectOptions = useMemo(
    () => Object.entries(SUBJECT_LABELS),
    []
  );

  const replaceContact = useCallback((updated) => {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === updated.id ? updated : contact
      )
    );
    setSelected((current) =>
      current?.id === updated.id ? updated : current
    );
  }, []);

  const handleOpen = async (contact) => {
    setSelected(contact);

    if (contact.status !== "NEW") {
      return;
    }

    try {
      setBusy(true);
      const response = await updateAdminContactStatus(
        contact.id,
        "READ"
      );

      if (response?.data) {
        replaceContact(response.data);
        setSummary((current) => ({
          ...current,
          new: Math.max(0, Number(current.new || 0) - 1),
          read: Number(current.read || 0) + 1,
        }));
      }
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible marcar la consulta como leída."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selected?.id) return;

    try {
      setBusy(true);
      setError("");

      const response = await updateAdminContactStatus(
        selected.id,
        status
      );

      if (response?.data) {
        replaceContact(response.data);
      }

      await loadContacts(pagination.page || 1);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible actualizar la consulta."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleReplySent = async (
    updatedContact
  ) => {
    if (!updatedContact?.id) {
      return;
    }

    replaceContact(
      updatedContact
    );

    await loadContacts(
      pagination.page || 1
    );
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
              Contactos
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Revisa y gestiona las consultas recibidas desde el sitio web.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadContacts(pagination.page || 1)}
            className="h-11 rounded-full border border-black/10 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Consultas"
          value={summary.total || 0}
          caption="Mensajes recibidos"
        />
        <MetricCard
          label="Nuevas"
          value={summary.new || 0}
          caption="Pendientes de revisión"
        />
        <MetricCard
          label="Leídas"
          value={summary.read || 0}
          caption="En gestión"
        />
        <MetricCard
          label="Respondidas"
          value={summary.responded || 0}
          caption={`${summary.closed || 0} cerrada${summary.closed === 1 ? "" : "s"}`}
        />
      </section>

      <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_.65fr_.8fr_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700">
              Buscar
            </span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nombre, empresa, correo, teléfono o mensaje..."
              className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
            />
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
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700">Motivo</span>
            <select
              value={filters.subject}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  subject: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
            >
              <option value="ALL">Todos</option>
              {subjectOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setFilters({
                search: "",
                status: "ALL",
                subject: "ALL",
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
        <div className="border-b border-neutral-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-black">Consultas recibidas</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {pagination.total || 0} resultado{pagination.total === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-neutral-500">
            Cargando consultas...
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-xl">
              ✉
            </div>
            <p className="mt-4 font-semibold text-neutral-900">
              Sin consultas para mostrar
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Cambia los filtros o espera nuevos mensajes del sitio web.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    <th className="px-6 py-3.5">Contacto</th>
                    <th className="px-4 py-3.5">Motivo</th>
                    <th className="px-4 py-3.5">Empresa</th>
                    <th className="px-4 py-3.5">Fecha</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={`transition hover:bg-neutral-50/70 ${
                        contact.status === "NEW" ? "bg-emerald-50/20" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                            {getInitials(contact)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">
                              {contact.first_name} {contact.last_name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-neutral-500">
                              {contact.email} · {contact.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-700">
                        {SUBJECT_LABELS[contact.subject] || contact.subject}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        {contact.company_name || "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-500">
                        {formatDate(contact.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={contact.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpen(contact)}
                            aria-label="Ver consulta"
                            title="Ver consulta"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-neutral-100 lg:hidden">
              {contacts.map((contact) => (
                <article key={contact.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                      {getInitials(contact)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-neutral-900">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <p className="mt-0.5 break-all text-xs text-neutral-500">
                        {contact.email}
                      </p>
                    </div>
                    <StatusBadge status={contact.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-neutral-50 p-4 text-xs">
                    <div>
                      <p className="text-neutral-400">Motivo</p>
                      <p className="mt-1 font-semibold text-neutral-700">
                        {SUBJECT_LABELS[contact.subject] || contact.subject}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-400">Fecha</p>
                      <p className="mt-1 font-semibold text-neutral-700">
                        {formatDate(contact.created_at)}
                      </p>
                    </div>
                    {contact.company_name && (
                      <div className="col-span-2">
                        <p className="text-neutral-400">Empresa</p>
                        <p className="mt-1 font-semibold text-neutral-700">
                          {contact.company_name}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpen(contact)}
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Ver consulta
                  </button>
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
                onClick={() => loadContacts(pagination.page - 1)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => loadContacts(pagination.page + 1)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>

      <DetailModal
        contact={selected}
        busy={busy}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        onReplySent={handleReplySent}
      />
    </main>
  );
}