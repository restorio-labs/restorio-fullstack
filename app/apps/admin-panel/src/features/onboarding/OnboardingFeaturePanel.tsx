import type { ComponentType, ReactElement, SVGProps } from "react";
import { TbBuildingStore, TbLayoutDashboard, TbMapPin, TbUsersGroup } from "react-icons/tb";

interface OnboardingFeaturePanelProps {
  activeStep: number;
  t: (key: string) => string;
}

const FEATURE_ICONS = [TbLayoutDashboard, TbMapPin, TbBuildingStore, TbUsersGroup] as ComponentType<
  SVGProps<SVGSVGElement>
>[];

export const OnboardingFeaturePanel = ({ activeStep, t }: OnboardingFeaturePanelProps): ReactElement => {
  const ActiveIcon = FEATURE_ICONS[activeStep];

  return (
    <aside className="relative isolate min-h-64 overflow-hidden bg-interactive-primary px-6 py-8 text-white lg:min-h-full lg:px-10 lg:py-12">
      <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-32 -left-24 size-80 rounded-full bg-black/10 blur-2xl" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Restorio</p>
          <h1 className="mt-3 max-w-md text-3xl font-bold leading-tight lg:text-4xl">{t("onboarding.title")}</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/75 lg:text-base">{t("onboarding.description")}</p>
        </div>

        <div className="relative mt-8 h-40 lg:my-12 lg:h-64" aria-hidden="true">
          <div className="onboarding-orbit absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 lg:size-52" />
          <div className="onboarding-feature-card absolute left-1/2 top-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-white/30 bg-white/20 shadow-2xl backdrop-blur-xl lg:size-32">
            <ActiveIcon className="size-11 lg:size-14" />
          </div>
          <div className="onboarding-overlay-card absolute left-[4%] top-[8%] rounded-xl border border-white/20 bg-white/15 px-4 py-3 shadow-lg backdrop-blur-md">
            <span className="block h-2 w-16 rounded-full bg-white/80" />
            <span className="mt-2 block h-1.5 w-24 rounded-full bg-white/30" />
          </div>
          <div className="onboarding-overlay-card-reverse absolute bottom-[5%] right-[2%] rounded-xl border border-white/20 bg-white/15 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex gap-1.5">
              <span className="size-2 rounded-full bg-white/40" />
              <span className="size-2 rounded-full bg-white/70" />
              <span className="size-2 rounded-full bg-white" />
            </div>
            <span className="mt-3 block h-1.5 w-20 rounded-full bg-white/35" />
          </div>
        </div>

        <div key={activeStep} className="onboarding-feature-copy">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
            {t(`onboarding.features.${activeStep}.eyebrow`)}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{t(`onboarding.features.${activeStep}.title`)}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/75">
            {t(`onboarding.features.${activeStep}.description`)}
          </p>
        </div>
      </div>
    </aside>
  );
};
