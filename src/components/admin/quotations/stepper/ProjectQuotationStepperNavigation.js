"use client";

export default function ProjectQuotationStepperNavigation({
  activeStep,
  totalSteps,
  onPrevious,
  onNext,
  hideNext = false,
}) {
  return (
    <section className="rounded-[26px] border border-black/5 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:px-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Paso {activeStep} de {totalSteps}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={onPrevious}
              className="h-11 rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              ← Anterior
            </button>
          ) : null}

          {!hideNext &&
          activeStep < totalSteps ? (
            <button
              type="button"
              onClick={onNext}
              className="h-11 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Siguiente →
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
