"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMailingSummary,
  getMailingContacts,
  createMailingContact,
  getMailingSegments,
  createMailingSegment,
  getMailingTemplates,
  createMailingTemplate,
  getMailingCampaigns,
  createMailingCampaign,
  getMailingSuppressions,
  createMailingSuppression,
} from "@/services/mailing.service";

const TABS = [
  ["summary", "Resumen"], ["contacts", "Contactos"], ["segments", "Segmentos"],
  ["templates", "Plantillas"], ["campaigns", "Campañas"], ["suppressions", "Supresiones"],
];

const Card = ({ label, value, hint }) => (
  <div className="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-sm">
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{label}</p>
    <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">{value ?? 0}</p>
    {hint ? <p className="mt-2 text-xs leading-5 text-neutral-500">{hint}</p> : null}
  </div>
);

export default function MailingAdminPage() {
  const [tab, setTab] = useState("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({});
  const [contacts, setContacts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [suppressions, setSuppressions] = useState([]);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [a,b,c,d,e,f] = await Promise.all([
        getMailingSummary(), getMailingContacts({ limit: 100 }), getMailingSegments(),
        getMailingTemplates(), getMailingCampaigns(), getMailingSuppressions(),
      ]);
      setSummary(a.summary || {}); setContacts(b.contacts || []); setSegments(c.segments || []);
      setTemplates(d.templates || []); setCampaigns(e.campaigns || []); setSuppressions(f.suppressions || []);
    } catch (e) { setError(e?.message || "No fue posible cargar Mailing"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const reset = () => setForm({});
  const submit = async (event) => {
    event.preventDefault();
    try {
      if (tab === "contacts") await createMailingContact(form);
      if (tab === "segments") await createMailingSegment(form);
      if (tab === "templates") await createMailingTemplate(form);
      if (tab === "campaigns") await createMailingCampaign(form);
      if (tab === "suppressions") await createMailingSuppression(form);
      reset(); await load();
    } catch (e) { window.alert(e?.message || "No fue posible guardar"); }
  };

  const rows = useMemo(() => ({ contacts, segments, templates, campaigns, suppressions }[tab] || []), [tab, contacts, segments, templates, campaigns, suppressions]);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Administración</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">Mailing</h1>
            <p className="mt-2 text-sm text-neutral-500">Contactos, segmentos, plantillas y campañas. Fase 1: sin envíos reales.</p>
          </div>
          <button onClick={load} className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium">Actualizar</button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map(([key,label]) => <button key={key} onClick={() => { setTab(key); reset(); }} className={`rounded-full px-4 py-2 text-sm ${tab===key ? "bg-black text-white" : "bg-white text-neutral-600 border border-neutral-200"}`}>{label}</button>)}
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}
        {loading ? <div className="mt-6 rounded-3xl bg-white p-8 text-sm text-neutral-500">Cargando...</div> : null}

        {!loading && tab === "summary" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <Card label="Contactos" value={summary.subscribed_contacts} hint="Suscritos" />
            <Card label="Segmentos" value={summary.active_segments} hint="Activos" />
            <Card label="Plantillas" value={summary.templates} />
            <Card label="Borradores" value={summary.draft_campaigns} />
            <Card label="Programadas" value={summary.scheduled_campaigns} />
            <Card label="Supresiones" value={summary.suppressions} />
          </div>
        ) : null}

        {!loading && tab !== "summary" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">
            <form onSubmit={submit} className="rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Crear {TABS.find(x=>x[0]===tab)?.[1]?.toLowerCase()}</h2>
              <div className="mt-5 space-y-4">
                {tab === "contacts" && <>
                  <Field label="Email" value={form.email} onChange={v=>setForm({...form,email:v})} required />
                  <Field label="Nombre" value={form.first_name} onChange={v=>setForm({...form,first_name:v})} />
                  <Field label="Apellido" value={form.last_name} onChange={v=>setForm({...form,last_name:v})} />
                  <Field label="Empresa" value={form.company_name} onChange={v=>setForm({...form,company_name:v})} />
                </>}
                {tab === "segments" && <>
                  <Field label="Nombre" value={form.name} onChange={v=>setForm({...form,name:v})} required />
                  <Area label="Descripción" value={form.description} onChange={v=>setForm({...form,description:v})} />
                </>}
                {tab === "templates" && <>
                  <Field label="Nombre" value={form.name} onChange={v=>setForm({...form,name:v})} required />
                  <Field label="Asunto" value={form.subject} onChange={v=>setForm({...form,subject:v})} required />
                  <Field label="Preheader" value={form.preview_text} onChange={v=>setForm({...form,preview_text:v})} />
                  <Area label="HTML" value={form.html_content} onChange={v=>setForm({...form,html_content:v})} rows={8} />
                </>}
                {tab === "campaigns" && <>
                  <Field label="Nombre campaña" value={form.name} onChange={v=>setForm({...form,name:v})} required />
                  <Field label="Asunto" value={form.subject} onChange={v=>setForm({...form,subject:v})} required />
                  <Select label="Segmento" value={form.segment_id} onChange={v=>setForm({...form,segment_id:v})} options={segments.map(x=>[x.id,x.name])} />
                  <Select label="Plantilla" value={form.template_id} onChange={v=>setForm({...form,template_id:v})} options={templates.map(x=>[x.id,x.name])} />
                  <Field label="Remitente" value={form.sender_name} onChange={v=>setForm({...form,sender_name:v})} />
                  <Field label="Sender email" value={form.sender_email} onChange={v=>setForm({...form,sender_email:v})} />
                  <Field label="Reply-To" value={form.reply_to} onChange={v=>setForm({...form,reply_to:v})} />
                </>}
                {tab === "suppressions" && <>
                  <Field label="Email" value={form.email} onChange={v=>setForm({...form,email:v})} required />
                  <Select label="Motivo" value={form.reason} onChange={v=>setForm({...form,reason:v})} options={[["UNSUBSCRIBED","Desuscrito"],["BOUNCE","Rebote"],["COMPLAINT","Queja"],["MANUAL","Manual"]]} />
                  <Area label="Notas" value={form.notes} onChange={v=>setForm({...form,notes:v})} />
                </>}
              </div>
              <button className="mt-6 w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Guardar</button>
            </form>

            <div className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-sm">
              <div className="border-b border-neutral-100 px-6 py-5"><h2 className="text-lg font-semibold">{TABS.find(x=>x[0]===tab)?.[1]}</h2></div>
              <div className="max-h-[680px] overflow-auto">
                {rows.length === 0 ? <div className="p-8 text-sm text-neutral-400">Todavía no hay registros.</div> : rows.map((row) => <Row key={row.id} tab={tab} row={row} />)}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Field({ label, value="", onChange, required=false }) { return <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</span><input required={required} value={value||""} onChange={e=>onChange(e.target.value)} className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black" /></label>; }
function Area({ label, value="", onChange, rows=4 }) { return <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</span><textarea rows={rows} value={value||""} onChange={e=>onChange(e.target.value)} className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black" /></label>; }
function Select({ label, value="", onChange, options=[] }) { return <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</span><select value={value||""} onChange={e=>onChange(e.target.value)} className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"><option value="">Seleccionar</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>; }
function Row({ tab, row }) {
  const title = tab === "contacts" ? row.email : row.name || row.email;
  const subtitle = tab === "contacts" ? [row.first_name,row.last_name,row.company_name].filter(Boolean).join(" · ") : tab === "campaigns" ? `${row.status}${row.segment_name ? ` · ${row.segment_name}` : ""}` : tab === "templates" ? row.subject : tab === "segments" ? `${row.rule_count || 0} reglas` : row.reason;
  return <div className="border-b border-neutral-100 px-6 py-4 last:border-0"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-neutral-900">{title}</p><p className="mt-1 text-xs text-neutral-500">{subtitle || "—"}</p></div>{row.status ? <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">{row.status}</span> : null}</div></div>;
}
