"use client";

export default function ShowroomStepperNavigation({
  activeStep,
  totalSteps,
  onPrevious,
  onNext,
  hideNext = false,
  nextDisabled = false,
  nextDisabledMessage = "",
}) {
  return (
    <section className="rounded-[24px] border border-black/5 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Paso {activeStep} de {totalSteps}
          </p>

          {nextDisabled && nextDisabledMessage ? (
            <p className="mt-1 text-xs text-amber-700">
              {nextDisabledMessage}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={onPrevious}
              className="h-11 rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              ← Anterior
            </button>
          ) : null}

          {!hideNext && activeStep < totalSteps ? (
            <button
              type="button"
              disabled={nextDisabled}
              onClick={onNext}
              className="h-11 rounded-full bg-black px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
