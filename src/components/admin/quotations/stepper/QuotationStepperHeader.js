"use client";

const STEPS = [
  {
    id: 1,
    label: "Cliente",
  },
  {
    id: 2,
    label: "Productos",
  },
  {
    id: 3,
    label: "Servicios e insumos",
  },
  {
    id: 4,
    label: "Finalizar venta",
  },
  {
    id: 5,
    label: "Confirmación",
  },
];

export default function QuotationStepperHeader({
  activeStep,
  onStepChange,
}) {
  const currentStep =
    STEPS.find((step) => step.id === activeStep) ||
    STEPS[0];

  return (
    <div className="mb-8 rounded-3xl border border-black/5 bg-white px-5 py-5 shadow-sm sm:px-6">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-neutral-200 md:block"
        />

        <div className="relative grid grid-cols-5 gap-1 sm:gap-2">
          {STEPS.map((step) => {
            const isActive = activeStep === step.id;
            const isCompleted = activeStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Paso ${step.id}: ${step.label}`}
                className="group relative flex min-w-0 flex-col items-center text-center focus-visible:outline-none"
              >
                <span
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold transition duration-200 group-focus-visible:ring-2 group-focus-visible:ring-emerald-600 group-focus-visible:ring-offset-2 ${
                    isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : isActive
                        ? "border-emerald-600 bg-white text-emerald-700"
                        : "border-neutral-200 bg-white text-neutral-400 group-hover:border-neutral-300 group-hover:text-neutral-600"
                  }`}
                >
                  {isCompleted ? "✓" : step.id}
                </span>

                <span
                  className={`mt-2 hidden max-w-[150px] text-[11px] font-semibold leading-tight sm:block ${
                    isActive
                      ? "text-emerald-700"
                      : isCompleted
                        ? "text-neutral-800"
                        : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </span>

                <span
                  className={`mt-1 text-[9px] font-medium uppercase tracking-[0.14em] sm:hidden ${
                    isActive
                      ? "text-emerald-700"
                      : "text-neutral-400"
                  }`}
                >
                  {step.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-black/5 pt-4 md:hidden">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Paso {activeStep} de {STEPS.length}
        </p>

        <p className="mt-1 text-sm font-semibold text-neutral-950">
          {currentStep.label}
        </p>
      </div>
    </div>
  );
}
