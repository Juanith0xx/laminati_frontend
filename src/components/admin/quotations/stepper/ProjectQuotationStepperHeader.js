"use client";

const STEPS = [
  {
    id: 1,
    label: "Proyecto y cliente",
    description: "Datos generales",
  },
  {
    id: 2,
    label: "Productos",
    description: "Configuración técnica",
  },
  {
    id: 3,
    label: "Servicios y otros",
    description: "Conceptos adicionales",
  },
  {
    id: 4,
    label: "Confirmación",
    description: "Revisión final",
  },
];

export default function ProjectQuotationStepperHeader({
  activeStep,
  onStepChange,
}) {
  const currentStep =
    STEPS.find(
      (step) =>
        step.id ===
        activeStep
    ) ||
    STEPS[0];

  return (
    <section className="rounded-[28px] border border-black/5 bg-white px-4 py-5 shadow-[0_1px_2px_rgba(0,0,0,.05)] sm:px-6">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-px bg-neutral-200 md:block"
        />

        <div className="relative grid grid-cols-4 gap-1 sm:gap-2">
          {STEPS.map(
            (step) => {
              const isActive =
                activeStep ===
                step.id;

              const isCompleted =
                activeStep >
                step.id;

              return (
                <button
                  key={step.id}
                  type="button"
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
                  className="group relative flex min-w-0 flex-col items-center text-center focus-visible:outline-none"
                >
                  <span
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold transition duration-200 group-focus-visible:ring-2 group-focus-visible:ring-violet-500 group-focus-visible:ring-offset-2 ${
                      isCompleted
                        ? "border-violet-600 bg-violet-600 text-white"
                        : isActive
                          ? "border-violet-600 bg-white text-violet-700"
                          : "border-neutral-200 bg-white text-neutral-400 group-hover:border-neutral-300 group-hover:text-neutral-600"
                    }`}
                  >
                    {isCompleted
                      ? "✓"
                      : step.id}
                  </span>

                  <span
                    className={`mt-2 hidden max-w-[180px] text-[11px] font-semibold leading-tight sm:block ${
                      isActive
                        ? "text-violet-700"
                        : isCompleted
                          ? "text-neutral-800"
                          : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </span>

                  <span className="mt-1 hidden max-w-[180px] text-[9px] leading-tight text-neutral-400 lg:block">
                    {step.description}
                  </span>

                  <span
                    className={`mt-1 text-[9px] font-medium uppercase tracking-[0.14em] sm:hidden ${
                      isActive
                        ? "text-violet-700"
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
