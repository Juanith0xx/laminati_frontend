"use client";

const STEPS = [
  { id: 1, label: "Cliente", description: "Cliente y documento" },
  { id: 2, label: "Productos", description: "Productos y servicios" },
  { id: 3, label: "Resumen", description: "Revisión de la operación" },
  { id: 4, label: "Pago", description: "Pago y finalización" },
];

export default function ShowroomStepperHeader({
  activeStep,
  onStepChange,
  quotationMode = false,
}) {
  const currentStep =
    STEPS.find((step) => step.id === activeStep) || STEPS[0];

  const progressPercentage =
    ((Math.max(activeStep, 1) - 1) / (STEPS.length - 1)) * 100;

  return (
    <section className="rounded-[28px] border border-black/5 bg-white px-4 py-6 shadow-[0_1px_2px_rgba(0,0,0,.05)] sm:px-6">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-[2px] overflow-hidden rounded-full bg-neutral-200 md:block"
        >
          <div
            className="h-full rounded-full bg-violet-600 transition-[width] duration-500 ease-out"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>

        <div className="relative grid grid-cols-4 gap-1 sm:gap-2">
          {STEPS.map((step) => {
            const isActive = activeStep === step.id;
            const isCompleted = activeStep > step.id;

            const label =
              step.id === 4 && quotationMode
                ? "Cotización"
                : step.label;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Paso ${step.id}: ${label}`}
                className="group relative flex min-w-0 flex-col items-center text-center focus-visible:outline-none"
              >
                <span
                  className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ease-out group-focus-visible:ring-2 group-focus-visible:ring-violet-500 group-focus-visible:ring-offset-2 ${
                    isCompleted
                      ? "scale-100 border-violet-600 bg-violet-600 text-white"
                      : isActive
                        ? "scale-110 border-violet-600 bg-violet-600 text-white shadow-[0_10px_28px_rgba(124,58,237,.22)]"
                        : "scale-100 border-neutral-200 bg-white text-neutral-400 group-hover:border-violet-300 group-hover:text-violet-600"
                  }`}
                >
                  {isCompleted ? "✓" : step.id}

                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute -inset-1 -z-10 rounded-full bg-violet-500/10 opacity-100 transition-opacity duration-300"
                    />
                  ) : null}
                </span>

                <span
                  className={`mt-3 hidden max-w-[170px] text-xs font-semibold leading-tight transition-colors duration-300 sm:block ${
                    isActive
                      ? "text-violet-700"
                      : isCompleted
                        ? "text-neutral-800"
                        : "text-neutral-400"
                  }`}
                >
                  {label}
                </span>

                <span
                  className={`mt-1 hidden max-w-[170px] text-[10px] leading-tight transition-colors duration-300 lg:block ${
                    isActive
                      ? "text-violet-400"
                      : "text-neutral-400"
                  }`}
                >
                  {step.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 border-t border-black/5 pt-4 md:hidden">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
          Paso {activeStep} de {STEPS.length}
        </p>

        <p className="mt-1 text-sm font-semibold text-neutral-950 transition-all duration-300">
          {activeStep === 4 && quotationMode
            ? "Cotización"
            : currentStep.label}
        </p>

        <p className="mt-0.5 text-xs text-neutral-500">
          {currentStep.description}
        </p>
      </div>
    </section>
  );
}
