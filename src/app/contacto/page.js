"use client";

import { useMemo, useState } from "react";
import { sendContactMessage } from "@/services/contact.service";

const SUBJECTS = [
  { value: "QUOTE", label: "Cotización" },
  { value: "PROJECT", label: "Asesoría en proyecto" },
  { value: "STOCK", label: "Disponibilidad y stock" },
  { value: "PRODUCT", label: "Consulta de producto" },
  { value: "BUSINESS", label: "Venta empresa" },
  { value: "OTHER", label: "Otro" },
];

const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  website: "",
};

function InfoIcon({ type }) {
  if (type === "mail") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }

  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M20 15.5a15.7 15.7 0 0 1-7-7L15.5 6l-4-4L8 5.5A3 3 0 0 0 7.5 9c2 4.5 5 7.5 9.5 9.5a3 3 0 0 0 3.5-.5l3.5-3.5-4-4-2.5 2.5Z" />
    </svg>
  );
}

function SuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cerrar mensaje"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-[30px] bg-white p-7 shadow-2xl sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
            <path d="m5 12 4 4L19 6" />
          </svg>
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
          Laminati · Contacto
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
          Consulta enviada
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Hemos recibido tu mensaje correctamente. Nuestro equipo revisará la consulta y se pondrá en contacto contigo.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-7 h-12 w-full rounded-full bg-black text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

  const messageCount = useMemo(() => form.message.length, [form.message]);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.subject ||
      !form.message.trim()
    ) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    if (form.message.trim().length < 10) {
      setError("Cuéntanos un poco más sobre tu consulta.");
      return;
    }

    try {
      setSending(true);

      await sendContactMessage({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        company_name: form.company_name.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject,
        message: form.message.trim(),
        website: form.website,
      });

      setForm(INITIAL_FORM);
      setSuccess(true);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible enviar tu consulta. Inténtalo nuevamente."
      );
    } finally {
      setSending(false);
    }
  };

  const fieldClass =
    "mt-2 h-14 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500";

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-4 pb-8 pt-12 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1240px]">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">
            Laminati · Contacto
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-5xl">
            Hablemos de tu proyecto
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-neutral-500 sm:text-base">
            Asesoría, cotizaciones y consultas para laminados, HPL y proyectos.
          </p>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[30px] border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.03)] sm:p-8"
          >
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                Envíanos tu consulta
              </h2>
              <p className="mt-1.5 text-sm text-neutral-500">
                Completa el formulario y te responderemos a la brevedad.
              </p>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-neutral-700">
                Nombre <span className="text-red-500">*</span>
                <input
                  value={form.first_name}
                  onChange={(event) => updateField("first_name", event.target.value)}
                  className={fieldClass}
                  placeholder="Tu nombre"
                  maxLength={120}
                  autoComplete="given-name"
                />
              </label>

              <label className="text-xs font-medium text-neutral-700">
                Apellido <span className="text-red-500">*</span>
                <input
                  value={form.last_name}
                  onChange={(event) => updateField("last_name", event.target.value)}
                  className={fieldClass}
                  placeholder="Tu apellido"
                  maxLength={120}
                  autoComplete="family-name"
                />
              </label>

              <label className="text-xs font-medium text-neutral-700 sm:col-span-2">
                Empresa
                <input
                  value={form.company_name}
                  onChange={(event) => updateField("company_name", event.target.value)}
                  className={fieldClass}
                  placeholder="Nombre de tu empresa (opcional)"
                  maxLength={255}
                  autoComplete="organization"
                />
              </label>

              <label className="text-xs font-medium text-neutral-700">
                Correo <span className="text-red-500">*</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className={fieldClass}
                  placeholder="tu@correo.com"
                  maxLength={255}
                  autoComplete="email"
                />
              </label>

              <label className="text-xs font-medium text-neutral-700">
                Teléfono <span className="text-red-500">*</span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className={fieldClass}
                  placeholder="+56 9 1234 5678"
                  maxLength={30}
                  autoComplete="tel"
                />
              </label>

              <label className="text-xs font-medium text-neutral-700 sm:col-span-2">
                Motivo <span className="text-red-500">*</span>
                <select
                  value={form.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                  className={`${fieldClass} appearance-none`}
                >
                  <option value="">Selecciona un motivo</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject.value} value={subject.value}>
                      {subject.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-neutral-700 sm:col-span-2">
                Mensaje <span className="text-red-500">*</span>
                <div className="relative mt-2">
                  <textarea
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value.slice(0, 1000))}
                    className="min-h-36 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-4 pb-8 text-sm leading-6 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500"
                    placeholder="Cuéntanos sobre tu proyecto, medidas, cantidades u otra información relevante."
                    maxLength={1000}
                  />
                  <span className="absolute bottom-3 right-4 text-[10px] text-neutral-400">
                    {messageCount}/1000
                  </span>
                </div>
              </label>

              <label className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                Sitio web
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => updateField("website", event.target.value)}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-5 h-12 w-full rounded-full bg-black text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Enviar consulta"}
            </button>
          </form>

          <aside className="rounded-[30px] border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.03)] sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              ¿En qué te podemos ayudar?
            </h2>

            <div className="mt-5 space-y-3">
              {["Cotizaciones", "Asesoría en proyectos", "Disponibilidad y stock", "Laminados y HPL", "Venta empresa"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="my-6 h-px bg-neutral-100" />

            <div className="space-y-3">
              <div className="flex gap-4 rounded-2xl bg-neutral-50 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-900 ring-1 ring-black/[0.05]">
                  <InfoIcon type="mail" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Te responderemos a los datos ingresados.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Nuestro equipo revisará tu consulta y se pondrá en contacto contigo.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-neutral-200 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-neutral-900">
                  <InfoIcon type="clock" />
                </span>
                <div>
                  <p className="text-xs text-neutral-400">Tiempo de respuesta</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    24 – 48 horas hábiles
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-neutral-200 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-neutral-900">
                  <InfoIcon type="phone" />
                </span>
                <div>
                  <p className="text-xs text-neutral-400">Atención personalizada</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Para consultas comerciales y proyectos puedes usar este formulario.
                  </p>
                  {contactEmail && (
                    <a
                      href={`mailto:${contactEmail}`}
                      className="mt-1 block text-sm font-semibold text-neutral-900 hover:underline"
                    >
                      {contactEmail}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {success && <SuccessModal onClose={() => setSuccess(false)} />}
    </main>
  );
}
