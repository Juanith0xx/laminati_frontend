const FALLBACK_PANELS = [
  {
    name: "Natural Oak",
    fallback:
      "linear-gradient(105deg,#d8b88d,#b88d62 48%,#8f6645)",
  },
  {
    name: "Dark Wood",
    fallback:
      "linear-gradient(105deg,#5b3925,#2f1c14 55%,#160d09)",
  },
  {
    name: "Stone",
    fallback:
      "linear-gradient(120deg,#dedbd4,#bcb8b0 55%,#938e86)",
  },
  {
    name: "Deep Timber",
    fallback:
      "linear-gradient(105deg,#55473b,#2b2520 58%,#181512)",
  },
];

function buildPanels(textures) {
  return FALLBACK_PANELS.map(
    (fallback, index) => ({
      ...fallback,
      ...(textures?.[index] || {}),
    })
  );
}

const configs = [
  "left-[2%] top-[20%] h-[58%] w-[48%] -rotate-[8deg] z-[4] sm:left-[5%] sm:top-[18%] sm:h-[65%] sm:w-[36%]",
  "left-[25%] top-[15%] h-[62%] w-[46%] -rotate-[2deg] z-[3] sm:left-[29%] sm:top-[13%] sm:h-[69%] sm:w-[33%]",
  "left-[49%] top-[20%] h-[57%] w-[44%] rotate-[6deg] z-[2] sm:left-[52%] sm:top-[17%] sm:h-[63%] sm:w-[31%]",
  "right-[-7%] top-[27%] h-[50%] w-[42%] rotate-[11deg] z-[1] sm:right-[0%] sm:top-[24%] sm:h-[57%] sm:w-[28%]",
];

export default function HeroLaminateMotion({
  textures = [],
}) {
  const panels = buildPanels(textures);

  return (
    <div
      className="relative min-h-[460px] w-full sm:min-h-[560px] lg:min-h-[650px]"
      aria-hidden="true"
    >
      <style>{`
        @keyframes laminate-enter {
          from { opacity: 0; transform: translateY(34px) scale(.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes laminate-float {
          from { transform: translateY(-5px); }
          to { transform: translateY(5px); }
        }
        @keyframes laminate-sheen {
          0%, 22% { transform: translateX(0); opacity: .25; }
          65%, 100% { transform: translateX(520%); opacity: .5; }
        }
        @keyframes laminate-shadow {
          from { transform: scaleX(.94); opacity: .16; }
          to { transform: scaleX(1.03); opacity: .23; }
        }
        .hero-laminate-enter {
          opacity: 0;
          animation: laminate-enter .8s cubic-bezier(.22,1,.36,1) forwards;
        }
        .hero-laminate-float {
          animation: laminate-float 5.2s ease-in-out infinite alternate;
        }
        .hero-laminate-sheen {
          animation: laminate-sheen 5.2s ease-in-out infinite;
        }
        .hero-laminate-shadow {
          animation: laminate-shadow 5.2s ease-in-out infinite alternate;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-laminate-enter,
          .hero-laminate-float,
          .hero-laminate-sheen,
          .hero-laminate-shadow {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="absolute inset-x-[5%] bottom-[12%] top-[8%] rounded-[50%] bg-[radial-gradient(circle_at_center,rgba(207,197,182,.30),rgba(245,244,240,0)_70%)] blur-2xl" />

      <div className="hero-laminate-shadow absolute bottom-[10%] left-[18%] h-[7%] w-[74%] rounded-[50%] bg-black/15 blur-2xl" />

      {panels.map((panel, index) => {
        const source =
          index === 0
            ? panel.imageUrl
            : panel.previewUrl || panel.imageUrl;

        return (
          <div
            key={panel.id || `${panel.name}-${index}`}
            className={`absolute ${configs[index]}`}
          >
            <div
              className="hero-laminate-enter h-full w-full"
              style={{
                animationDelay: `${index * 90}ms`,
              }}
            >
              <div
                className="hero-laminate-float relative h-full w-full"
                style={{
                  animationDelay: `${index * 260}ms`,
                }}
              >
                <div className="relative z-10 h-full w-full overflow-hidden rounded-[1.8rem] border border-black/[0.05] bg-[#d3cabf] shadow-[0_18px_45px_rgba(0,0,0,0.14),0_4px_12px_rgba(0,0,0,0.08)] sm:rounded-[2.2rem]">
                  {source ? (
                    <img
                      src={source}
                      alt=""
                      width="900"
                      height="1200"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: panel.fallback }}
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10" />
                  <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
                  <div
                    className="hero-laminate-sheen absolute -left-[55%] top-[-12%] h-[125%] w-[27%] skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/32 to-transparent blur-[1px]"
                    style={{
                      animationDelay: `${1000 + index * 650}ms`,
                    }}
                  />

                  <div className="absolute bottom-4 left-4 hidden max-w-[75%] rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md xl:block">
                    {panel.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-[4%] left-[7%] z-[9] hidden max-w-[220px] rounded-2xl border border-black/[0.05] bg-white/95 p-4 shadow-[0_15px_38px_rgba(0,0,0,0.08)] backdrop-blur sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
          Materialidad
        </p>
        <p className="mt-2 text-sm font-medium leading-5 text-neutral-800">
          Superficies reales de nuestro catálogo.
        </p>
      </div>
    </div>
  );
}
