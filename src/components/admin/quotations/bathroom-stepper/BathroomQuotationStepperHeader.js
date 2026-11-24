"use client";

const STEPS = [
  {
    id: 1,
    label: "Proyecto y configuración",
    description: "Datos y cubículos",
  },
  {
    id: 2,
    label: "Materiales",
    description: "HPL y espesores",
  },
  {
    id: 3,
    label: "Optimización",
    description: "Piezas, cortes y valorización",
  },
  {
    id: 4,
    label: "Cliente",
    description: "Datos comerciales",
  },
  {
    id: 5,
    label: "Confirmación",
    description: "Resumen y cotización",
  },
];

export default function BathroomQuotationStepperHeader({
  activeStep,
  maxAvailableStep = 1,
  onStepChange,
}) {
  const currentStep =
    STEPS.find(
      (step) =>
        step.id === activeStep
    ) || STEPS[0];

  return (
    <section className="mb-6 rounded-[28px] border border-black/5 bg-white px-4 py-5 shadow-[0_1px_2px_rgba(0,0,0,.05)] sm:px-6">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-neutral-200 md:block"
        />

        <div className="relative grid grid-cols-5 gap-1 sm:gap-2">
          {STEPS.map(
            (step) => {
              const isActive =
                activeStep ===
                step.id;

              const isCompleted =
                activeStep >
                step.id;

              const isLocked =
                step.id >
                maxAvailableStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() =>
                    onStepChange(
                      step.id
                    )
                  }
                  aria-current={
                    isActive
                      ? "step"
                      : undefined
                  }
                  aria-label={`Paso ${step.id}: ${step.label}`}
                  className="group relative flex min-w-0 flex-col items-center text-center focus-visible:outline-none disabled:cursor-not-allowed"
                >
                  <span
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold transition duration-200 group-focus-visible:ring-2 group-focus-visible:ring-[#679300] group-focus-visible:ring-offset-2 ${
                      isCompleted
                        ? "border-[#679300] bg-[#679300] text-white"
                        : isActive
                          ? "border-[#679300] bg-white text-[#679300]"
                          : isLocked
                            ? "border-neutral-200 bg-neutral-50 text-neutral-300"
                            : "border-neutral-200 bg-white text-neutral-400 group-hover:border-neutral-300 group-hover:text-neutral-600"
                    }`}
                  >
                    {isCompleted
                      ? "✓"
                      : step.id}
                  </span>

                  <span
                    className={`mt-2 hidden max-w-[170px] text-[11px] font-semibold leading-tight sm:block ${
                      isActive
                        ? "text-[#679300]"
                        : isCompleted
                          ? "text-neutral-800"
                          : isLocked
                            ? "text-neutral-300"
                            : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </span>

                  <span
                    className={`mt-1 hidden max-w-[170px] text-[9px] leading-tight lg:block ${
                      isLocked
                        ? "text-neutral-300"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.description}
                  </span>

                  <span
                    className={`mt-1 text-[9px] font-medium uppercase tracking-[0.14em] sm:hidden ${
                      isActive
                        ? "text-[#679300]"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.id}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-black/5 pt-4 md:hidden">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Paso {activeStep} de {STEPS.length}
        </p>

        <p className="mt-1 text-sm font-semibold text-neutral-950">
          {currentStep.label}
        </p>

        <p className="mt-0.5 text-xs text-neutral-500">
          {currentStep.description}
        </p>
      </div>
    </section>
  );
}
