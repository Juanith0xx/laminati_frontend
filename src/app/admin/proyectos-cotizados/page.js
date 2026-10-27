"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addProjectBoardNote,
  createProjectFollowup,
  getProjectBoard,
  getProjectBoardCalendar,
  getProjectBoardDetail,
  getProjectBoardUsers,
  updateProjectBoard,
  updateProjectFollowup,
} from "@/services/projectBoard.service";

import {
  ADMIN_NOTIFICATION_RECEIVED_EVENT,
} from "@/services/adminNotifications.service";

const STAGES = [
  ["DRAFT", "Borrador", "bg-neutral-400", "bg-neutral-50"],
  ["SENT", "Enviada", "bg-blue-500", "bg-blue-50/40"],
  ["REVIEW", "En revisión", "bg-amber-400", "bg-amber-50/40"],
  ["NEGOTIATION", "Negociación", "bg-orange-500", "bg-orange-50/40"],
  ["APPROVED", "Aprobada", "bg-emerald-400", "bg-emerald-50/40"],
  ["WON", "Ganada", "bg-green-600", "bg-green-50/50"],
  ["LOST", "Perdida", "bg-red-500", "bg-red-50/40"],
];

const PRIORITIES = [
  ["LOW", "Baja"],
  ["MEDIUM", "Media"],
  ["HIGH", "Alta"],
  ["URGENT", "Urgente"],
];

const CHANNELS = [
  ["EMAIL", "Correo"],
  ["WHATSAPP", "WhatsApp"],
  ["PHONE", "Teléfono"],
  ["SHOWROOM", "Showroom"],
  ["WEB", "Página Web"],
];

const FOLLOWUP_TYPES = [
  ["FOLLOW_UP", "Seguimiento"],
  ["CALL", "Llamada"],
  ["MEETING", "Reunión"],
  ["EMAIL", "Correo"],
  ["TECHNICAL_MEETING", "Reunión técnica"],
  ["SAMPLE_DELIVERY", "Entrega muestra"],
  ["MILESTONE", "Hito"],
  ["OTHER", "Otro"],
];

const money = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const dt = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const d = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const clean = (v) => String(v ?? "").trim();
const fmtDate = (v) => {
  if (!v) return "—";
  const x = new Date(v);
  return Number.isNaN(x.getTime()) ? "—" : d.format(x);
};
const fmtDateTime = (v) => {
  if (!v) return "—";
  const x = new Date(v);
  return Number.isNaN(x.getTime()) ? "—" : dt.format(x);
};
const stageLabel = (v) => STAGES.find((s) => s[0] === v)?.[1] || v || "—";
const channelLabel = (v) =>
  CHANNELS.find((channel) => channel[0] === clean(v).toUpperCase())?.[1] || "Sin canal";

const channelTheme = (value) => {
  const normalized = clean(value).toUpperCase();

  switch (normalized) {
    case "EMAIL":
      return {
        label: "Correo",
        tone: "border-orange-200 bg-orange-50 text-orange-700",
        iconWrap: "bg-orange-100 text-orange-600",
      };
    case "WHATSAPP":
      return {
        label: "WhatsApp",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
        iconWrap: "bg-emerald-100 text-emerald-600",
      };
    case "PHONE":
      return {
        label: "Teléfono",
        tone: "border-neutral-900 bg-neutral-900 text-white",
        iconWrap: "bg-white/15 text-white",
      };
    case "SHOWROOM":
      return {
        label: "Showroom",
        tone: "border-blue-200 bg-blue-50 text-blue-700",
        iconWrap: "bg-blue-100 text-blue-600",
      };
    case "WEB":
      return {
        label: "Página Web",
        tone: "border-violet-200 bg-violet-50 text-violet-700",
        iconWrap: "bg-violet-100 text-violet-600",
      };
    default:
      return {
        label: "Sin canal",
        tone: "border-neutral-200 bg-neutral-50 text-neutral-500",
        iconWrap: "bg-neutral-100 text-neutral-400",
      };
  }
};

function UserIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.25a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function EyeIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function ChannelIcon({ channel, className = "h-3.5 w-3.5" }) {
  const normalized = clean(channel).toUpperCase();

  if (normalized === "EMAIL") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m5.5 8 6.5 5 6.5-5" />
      </svg>
    );
  }

  if (normalized === "WHATSAPP") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 11.5a8 8 0 0 1-11.7 7.06L4 20l1.52-4.04A8 8 0 1 1 20 11.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.4 8.85c.2-.44.42-.45.62-.46.16-.01.34-.01.52-.01.18 0 .47.07.72.34.25.27.95.93.95 2.27 0 1.34-.97 2.64-1.1 2.82-.13.18-1.87 2.98-4.62 4.04-2.28.88-2.75.7-3.24.66-.49-.04-1.58-.65-1.81-1.28-.23-.63-.23-1.17-.16-1.28.07-.11.25-.18.52-.31.27-.13.63-.34.81-.52.18-.18.36-.2.61-.07.25.13 1.56.77 1.83.91.27.14.45.2.52.31.07.11.07.63-.16 1.24" transform="translate(6.2 1.2) scale(.62)" />
      </svg>
    );
  }

  if (normalized === "PHONE") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h2.1c.4 0 .76.24.91.61l1.2 2.89a1 1 0 0 1-.23 1.1L9.4 9.7a13.06 13.06 0 0 0 4.9 4.9l1.35-1.33a1 1 0 0 1 1.1-.23l2.89 1.2c.37.15.61.51.61.91v2.1a1.5 1.5 0 0 1-1.5 1.5h-.75C9.68 19.75 4.25 14.32 4.25 7.5v-.75a1.5 1.5 0 0 1 1.5-1.5Z" />
      </svg>
    );
  }

  if (normalized === "SHOWROOM") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.25 12 4l8 6.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.25 9.5v9.25h11.5V9.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 18.75v-5h4v5" />
      </svg>
    );
  }

  if (normalized === "WEB") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="8.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5M12 3.75c2.4 2.19 3.75 5.12 3.75 8.25S14.4 18.06 12 20.25c-2.4-2.19-3.75-5.12-3.75-8.25S9.6 5.94 12 3.75Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.75 12h6.5" />
    </svg>
  );
}

const chileTodayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const isExpiredQuotation = (validUntil) => {
  const value = clean(validUntil).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value < chileTodayKey();
};

function Summary({ label, value, helper }) {
  return (
    <div className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{helper}</p>
    </div>
  );
}

function Card({ project, selected, onSelect }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/project-id", project.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onSelect(project.id)}
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-black ring-1 ring-black" : "border-black/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
              {project.quote_number}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] ${
                clean(project.quotation_type).toUpperCase() === "PROJECT"
                  ? "bg-violet-50 text-violet-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {clean(project.quotation_type).toUpperCase() === "PROJECT" ? "Proyecto" : "Cotización"}
            </span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-950">
            {project.project_name ||
              (clean(project.quotation_type).toUpperCase() === "PROJECT"
                ? "Proyecto sin nombre"
                : "Cotización comercial")}
          </h3>
          <p className="mt-1 truncate text-xs text-neutral-500">
            {project.legal_name || project.customer_name}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${
            project.priority === "URGENT"
              ? "bg-red-50 text-red-600"
              : project.priority === "HIGH"
                ? "bg-amber-50 text-amber-700"
                : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {PRIORITIES.find((p) => p[0] === project.priority)?.[1] || "Media"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-neutral-950">
          {money.format(Number(project.total || 0))}
        </span>
        <span
          className={`text-[10px] ${
            isExpiredQuotation(project.valid_until)
              ? "font-semibold text-red-500"
              : "text-neutral-400"
          }`}
        >
          {isExpiredQuotation(project.valid_until) ? "venció" : "vence"}{" "}
          {fmtDate(project.valid_until)}
        </span>
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-3">
        <p className="truncate text-[11px] font-medium text-neutral-600">
          {project.next_followup_title || project.next_action || "Sin próxima acción"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5 text-blue-500" />
            <span>{project.assigned_name || project.created_by_name || "Sin responsable"}</span>
          </span>

          {(() => {
            const theme = channelTheme(project.channel);
            return (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${theme.tone}`}>
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${theme.iconWrap}`}>
                  <ChannelIcon channel={project.channel} className="h-3 w-3" />
                </span>
                <span>{theme.label}</span>
              </span>
            );
          })()}

          <span className={`inline-flex items-center gap-1.5 ${Number(project.view_count || 0) > 0 ? "text-blue-600" : "text-neutral-400"}`}>
            <EyeIcon className="h-3.5 w-3.5" />
            <span>{Number(project.view_count || 0) > 0 ? `${project.view_count} vista(s)` : "Sin vista"}</span>
          </span>
        </div>
      </div>
    </button>
  );
}

function MiniCalendar({ month, items, previous, next }) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const byDay = new Map();

  items.forEach((item) => {
    const value = new Date(item.event_at);
    if (value.getFullYear() !== year || value.getMonth() !== monthIndex) return;
    const day = value.getDate();
    byDay.set(day, [...(byDay.get(day) || []), item]);
  });

  const label = new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
  }).format(month);

  return (
    <div className="rounded-[1.4rem] border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold capitalize text-neutral-900">{label}</h3>
        <div className="flex gap-1">
          <button type="button" onClick={previous} className="h-8 w-8 rounded-full border border-neutral-200">‹</button>
          <button type="button" onClick={next} className="h-8 w-8 rounded-full border border-neutral-200">›</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-neutral-400">
        {["L","M","M","J","V","S","D"].map((x,i)=><div key={`${x}-${i}`}>{x}</div>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day,index)=>{
          if (!day) return <div key={`e-${index}`} className="h-9" />;
          const dayItems=byDay.get(day)||[];
          return (
            <div
              key={day}
              title={dayItems.map((x)=>x.title).join("\n")}
              className={`relative flex h-9 items-center justify-center rounded-xl text-xs ${
                dayItems.length ? "bg-neutral-100 font-semibold text-black" : "text-neutral-500"
              }`}
            >
              {day}
              {dayItems.length ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-black" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Detail({
  detail,
  users,
  calendarItems,
  month,
  previousMonth,
  nextMonth,
  update,
  refresh,
  addFollowup,
  completeFollowup,
  addNote,
}) {
  const [title,setTitle]=useState("");
  const [type,setType]=useState("FOLLOW_UP");
  const [when,setWhen]=useState("");
  const [note,setNote]=useState("");

  if (!detail) {
    return (
      <aside className="space-y-4">
        <div className="rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Detalles</p>
          <h2 className="mt-2 text-lg font-semibold text-neutral-950">Selecciona una cotización</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Abre una tarjeta para revisar historial, seguimiento y próximas acciones comerciales.
          </p>
        </div>
        <MiniCalendar month={month} items={calendarItems} previous={previousMonth} next={nextMonth} />
      </aside>
    );
  }

  const { quotation, management, followups = [], timeline = [] } = detail;
  const pending=followups.filter((f)=>f.status==="PENDING");
  const quotationExpired = isExpiredQuotation(quotation.valid_until);
  const quotationStatus = clean(quotation.status).toUpperCase();
  const canEditQuotation = ["DRAFT", "SENT", "EXPIRED"].includes(quotationStatus);

  return (
    <aside className="space-y-4">
      <div className="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{quotation.quote_number}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] ${
                  clean(quotation.quotation_type).toUpperCase() === "PROJECT"
                    ? "bg-violet-50 text-violet-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {clean(quotation.quotation_type).toUpperCase() === "PROJECT" ? "Proyecto" : "Cotización"}
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-neutral-950">
              {quotation.project_name ||
                (clean(quotation.quotation_type).toUpperCase() === "PROJECT"
                  ? "Proyecto sin nombre"
                  : "Cotización comercial")}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">{quotation.legal_name || quotation.customer_name}</p>
          </div>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">
            {stageLabel(management?.stage)}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div><p className="text-neutral-400">Monto</p><p className="mt-1 font-semibold">{money.format(Number(quotation.total||0))}</p></div>
          <div><p className="text-neutral-400">Válida hasta</p><p className="mt-1 font-semibold">{fmtDate(quotation.valid_until)}</p></div>
          <div><p className="text-neutral-400">RUT</p><p className="mt-1 font-semibold">{quotation.rut}</p></div>
          <div><p className="text-neutral-400">Referencia</p><p className="mt-1 font-semibold">{quotation.project_reference || "—"}</p></div>
        </div>

        {quotationExpired ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800">
            Esta cotización está vencida. Puedes editarla para renovar su vigencia sin perder el número {quotation.quote_number}.
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Etapa comercial
            <select value={management?.stage||"DRAFT"} onChange={(e)=>update({stage:e.target.value})}
              className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800">
              {STAGES.map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Prioridad
            <select value={management?.priority||"MEDIUM"} onChange={(e)=>update({priority:e.target.value})}
              className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800">
              {PRIORITIES.map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Responsable
            <select value={management?.assigned_to||""} onChange={(e)=>update({assigned_to:e.target.value||null})}
              className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800">
              <option value="">Sin responsable</option>
              {users.map((u)=><option key={u.id} value={u.id}>{`${u.first_name||""} ${u.last_name||""}`.trim()||u.email}</option>)}
            </select>
          </label>

          <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Canal
            <select
              value={management?.channel || ""}
              onChange={(e) => update({ channel: e.target.value || null })}
              className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800"
            >
              <option value="">Sin canal</option>
              {CHANNELS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="mt-2 flex items-center gap-2">
              {(() => {
                const theme = channelTheme(management?.channel);
                return (
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold normal-case tracking-normal ${theme.tone}`}>
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${theme.iconWrap}`}>
                      <ChannelIcon channel={management?.channel} className="h-3.5 w-3.5" />
                    </span>
                    {theme.label}
                  </span>
                );
              })()}
            </div>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {canEditQuotation ? (
            <Link
              href={`/admin/showroom/cotizaciones/${quotation.id}/editar`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-black px-4 py-3 text-center text-xs font-semibold !text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              Editar cotización
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-100 px-4 py-3 text-center text-xs font-semibold text-neutral-400">
              Edición no disponible
            </span>
          )}

          <Link
            href={`/admin/showroom/cotizaciones/${quotation.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center text-xs font-semibold !text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            Ver cotización
          </Link>

          <button
            type="button"
            onClick={refresh}
            title="Actualizar datos"
            className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <span aria-hidden="true">↻</span>
            Actualizar datos
          </button>
        </div>
      </div>

      <MiniCalendar
        month={month}
        items={calendarItems.filter((x)=>x.quotation_id===quotation.id)}
        previous={previousMonth}
        next={nextMonth}
      />

      <div className="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Agendar seguimiento</p>
        <div className="mt-3 grid gap-2">
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Ej. Llamar al cliente"
            className="h-10 rounded-xl border border-neutral-200 px-3 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={type} onChange={(e)=>setType(e.target.value)} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs">
              {FOLLOWUP_TYPES.map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
            <input type="datetime-local" value={when} onChange={(e)=>setWhen(e.target.value)}
              className="h-10 rounded-xl border border-neutral-200 px-2 text-xs" />
          </div>
          <button type="button" onClick={async()=>{
            if(!clean(title)||!when)return;
            await addFollowup({title,followup_type:type,scheduled_at:new Date(when).toISOString()});
            setTitle(""); setWhen("");
          }} className="rounded-xl bg-black px-4 py-3 text-xs font-semibold text-white">
            Agendar
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {pending.length ? pending.slice(0,5).map((f)=>(
            <div key={f.id} className="flex items-start justify-between gap-3 rounded-xl bg-neutral-50 p-3">
              <div><p className="text-xs font-semibold">{f.title}</p><p className="mt-1 text-[10px] text-neutral-400">{fmtDateTime(f.scheduled_at)}</p></div>
              <button type="button" onClick={()=>completeFollowup(f.id)}
                className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-semibold">Completar</button>
            </div>
          )) : <p className="text-xs text-neutral-400">No hay seguimientos pendientes.</p>}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Nota rápida</p>
        <textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={3}
          placeholder="Registrar conversación, acuerdo o dato relevante..."
          className="mt-3 w-full resize-none rounded-xl border border-neutral-200 p-3 text-sm" />
        <button type="button" onClick={async()=>{if(!clean(note))return;await addNote(note);setNote("");}}
          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-semibold">
          Guardar nota
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Historial</p>
        <div className="mt-4 space-y-4">
          {timeline.slice(0,15).map((event,index)=>(
            <div key={`${event.source}-${event.event_at}-${index}`} className="relative pl-5">
              <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-neutral-300" />
              <p className="text-xs font-semibold text-neutral-900">{event.title || event.event_type}</p>
              {event.description ? <p className="mt-1 text-[11px] leading-5 text-neutral-500">{event.description}</p> : null}
              <p className="mt-1 text-[10px] text-neutral-400">{fmtDateTime(event.event_at)}{event.actor_name?` · ${event.actor_name}`:""}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function ProjectBoardPage() {
  const [projects,setProjects]=useState([]);
  const [summary,setSummary]=useState({});
  const [users,setUsers]=useState([]);
  const [selectedId,setSelectedId]=useState(null);
  const [detail,setDetail]=useState(null);
  const [search,setSearch]=useState("");
  const [priority,setPriority]=useState("ALL");
  const [assigned,setAssigned]=useState("ALL");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [month,setMonth]=useState(()=>{
    const x=new Date();
    return new Date(x.getFullYear(),x.getMonth(),1);
  });
  const [calendarItems,setCalendarItems]=useState([]);

  const loadBoard=useCallback(async()=>{
    try{
      setLoading(true); setError("");
      const response=await getProjectBoard({
        search:clean(search)||undefined,
        priority:priority==="ALL"?undefined:priority,
        assigned_to:assigned==="ALL"?undefined:assigned,
      });
      setProjects(response?.projects||[]);
      setSummary(response?.summary||{});
    }catch(e){setError(e?.message||"No fue posible cargar el Board.");}
    finally{setLoading(false);}
  },[search,priority,assigned]);

  const loadDetail=useCallback(async(id)=>{
    if(!id){setDetail(null);return;}
    try{const response=await getProjectBoardDetail(id);setDetail(response?.data||null);}
    catch(e){setError(e?.message||"No fue posible cargar la cotización.");}
  },[]);

  const loadCalendar=useCallback(async()=>{
    const from=new Date(month.getFullYear(),month.getMonth(),1);
    const to=new Date(month.getFullYear(),month.getMonth()+1,1);
    try{
      const response=await getProjectBoardCalendar({from:from.toISOString(),to:to.toISOString()});
      setCalendarItems(response?.items||[]);
    }catch(e){console.error(e);}
  },[month]);

  useEffect(()=>{const timer=window.setTimeout(loadBoard,250);return()=>window.clearTimeout(timer);},[loadBoard]);
  useEffect(()=>{getProjectBoardUsers().then((r)=>setUsers(r?.users||[])).catch(console.error);},[]);
  useEffect(()=>{loadCalendar();},[loadCalendar]);
  useEffect(()=>{loadDetail(selectedId);},[selectedId,loadDetail]);

  const grouped=useMemo(()=>Object.fromEntries(
    STAGES.map(([value])=>[value,projects.filter((p)=>p.stage===value)])
  ),[projects]);

  const refresh=useCallback(async()=>{
    await Promise.all([
      loadBoard(),
      loadCalendar(),
      selectedId?loadDetail(selectedId):Promise.resolve(),
    ]);
  },[loadBoard,loadCalendar,loadDetail,selectedId]);

  useEffect(()=>{
    const handleRealtimeNotification=()=>{
      refresh().catch(console.error);
    };

    window.addEventListener(
      ADMIN_NOTIFICATION_RECEIVED_EVENT,
      handleRealtimeNotification
    );

    return()=>{
      window.removeEventListener(
        ADMIN_NOTIFICATION_RECEIVED_EVENT,
        handleRealtimeNotification
      );
    };
  },[refresh]);

  const updateSelected=async(payload)=>{
    if(!selectedId)return;
    try{await updateProjectBoard(selectedId,payload);await refresh();}
    catch(e){setError(e?.message||"No fue posible actualizar la cotización.");}
  };

  const onDrop=async(event,stage)=>{
    event.preventDefault();
    const id=event.dataTransfer.getData("text/project-id");
    if(!id)return;
    try{
      await updateProjectBoard(id,{stage});
      setSelectedId(id);
      await refresh();
    }catch(e){setError(e?.message||"No fue posible mover la cotización.");}
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1700px]">
        <section className="rounded-[1.75rem] border border-black/5 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Laminati · Comercial</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">Board de cotizaciones</h1>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Seguimiento comercial, historial, próximas acciones y calendario de todas las cotizaciones, tanto comerciales como de proyecto.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={refresh} className="h-11 rounded-full border border-neutral-200 px-5 text-sm font-medium">Actualizar</button>
              <Link href="/admin/cotizaciones/nueva/proyecto" className="inline-flex h-11 items-center rounded-full bg-black px-5 text-sm font-semibold !text-white transition hover:bg-neutral-800">
                + Nueva cotización de proyecto
              </Link>
            </div>
          </div>
          {error ? <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary label="Cotizaciones activas" value={Number(summary.active_quotations ?? summary.active_projects ?? 0)} helper="Cotizaciones en proceso comercial" />
          <Summary label="En revisión / negociación" value={Number(summary.in_review||0)} helper="Cotizaciones que requieren seguimiento" />
          <Summary label="Ganadas" value={Number(summary.won_quotations ?? summary.won_projects ?? 0)} helper="Cotizaciones cerradas con éxito" />
          <Summary label="Monto total cotizado" value={money.format(Number(summary.total_quoted||0))} helper="Suma de cotizaciones según filtros" />
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.4fr)_220px_260px_auto]">
            <input value={search} onChange={(e)=>setSearch(e.target.value)}
              placeholder="Buscar COT, proyecto, cliente, RUT o código..."
              className="h-11 rounded-xl border border-neutral-200 px-4 text-sm" />
            <select value={priority} onChange={(e)=>setPriority(e.target.value)}
              className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm">
              <option value="ALL">Todas las prioridades</option>
              {PRIORITIES.map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
            <select value={assigned} onChange={(e)=>setAssigned(e.target.value)}
              className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm">
              <option value="ALL">Todos los responsables</option>
              {users.map((u)=><option key={u.id} value={u.id}>{`${u.first_name||""} ${u.last_name||""}`.trim()||u.email}</option>)}
            </select>
            <button type="button" onClick={()=>{setSearch("");setPriority("ALL");setAssigned("ALL");}}
              className="h-11 rounded-xl border border-neutral-200 px-4 text-sm font-medium">Limpiar</button>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0 rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
            {loading ? (
              <div className="grid min-h-[420px] place-items-center text-sm text-neutral-400">Cargando cotizaciones...</div>
            ) : (
              <div className="space-y-3">
                {STAGES.map(([value,label,dot,panel])=>{
                  const stageProjects = grouped[value] || [];

                  return (
                    <div
                      key={value}
                      onDragOver={(e)=>e.preventDefault()}
                      onDrop={(e)=>onDrop(e,value)}
                      className={`grid gap-2 rounded-2xl border border-black/5 p-2.5 transition sm:grid-cols-[138px_minmax(0,1fr)] ${panel} ${
                        stageProjects.length ? "min-h-[136px]" : "min-h-[68px]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2.5 sm:bg-white/60">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                          <h2 className="text-sm font-semibold text-neutral-900">{label}</h2>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-neutral-500 shadow-sm">
                          {stageProjects.length}
                        </span>
                      </div>

                      <div className="min-w-0 overflow-x-auto pb-1">
                        {stageProjects.length ? (
                          <div className="flex min-w-max gap-3 pr-1">
                            {stageProjects.map((project)=>(
                              <div key={project.id} className="w-[280px] shrink-0">
                                <Card
                                  project={project}
                                  selected={selectedId===project.id}
                                  onSelect={setSelectedId}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex min-h-[46px] items-center rounded-xl border border-dashed border-black/10 bg-white/35 px-4 text-xs text-neutral-400">
                            Sin cotizaciones · arrastra aquí para mover a {label.toLowerCase()}.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="xl:sticky xl:top-24 xl:self-start">
          <Detail
            detail={detail}
            users={users}
            calendarItems={calendarItems}
            month={month}
            previousMonth={()=>setMonth((m)=>new Date(m.getFullYear(),m.getMonth()-1,1))}
            nextMonth={()=>setMonth((m)=>new Date(m.getFullYear(),m.getMonth()+1,1))}
            update={updateSelected}
            refresh={()=>selectedId?loadDetail(selectedId):null}
            addFollowup={async(payload)=>{await createProjectFollowup(selectedId,payload);await refresh();}}
            completeFollowup={async(id)=>{await updateProjectFollowup(selectedId,id,{status:"COMPLETED"});await refresh();}}
            addNote={async(value)=>{await addProjectBoardNote(selectedId,value);await refresh();}}
          />
          </div>
        </div>
      </div>
    </div>
  );
}
