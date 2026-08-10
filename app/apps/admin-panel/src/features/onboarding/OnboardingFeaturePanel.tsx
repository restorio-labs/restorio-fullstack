import type { ComponentType, ReactElement, SVGProps } from "react";
import {
  TbBuildingStore,
  TbCircleCheck,
  TbLayoutDashboard,
  TbMail,
  TbMapPin,
  TbUser,
  TbUsersGroup,
} from "react-icons/tb";

interface OnboardingFeaturePanelProps {
  activeStep: number;
  t: (key: string) => string;
}

interface CloudContent {
  detail: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
}

const FEATURE_ICONS = [TbLayoutDashboard, TbMapPin, TbBuildingStore, TbUsersGroup] as ComponentType<
  SVGProps<SVGSVGElement>
>[];

const PANEL_BACKGROUND_COLORS = [
  "var(--color-interactive-primary)",
  "var(--color-interactive-primary-hover)",
  "var(--color-interactive-accent-teal-foreground)",
  "var(--color-interactive-accent-warm-foreground)",
] as const;

const CLOUD_ONE_POSITIONS = [
  { left: "4%", top: "8%" },
  { left: "4%", top: "calc(100% - 5.5rem)" },
  { left: "calc(100% - 9rem)", top: "calc(100% - 5.5rem)" },
  { left: "calc(100% - 9rem)", top: "8%" },
] as const;

const CLOUD_TWO_POSITIONS = [
  { left: "calc(100% - 9rem)", top: "calc(100% - 5.5rem)" },
  { left: "calc(100% - 9rem)", top: "8%" },
  { left: "4%", top: "8%" },
  { left: "4%", top: "calc(100% - 5.5rem)" },
] as const;

const CLOUD_CONTENT: { first: CloudContent; second: CloudContent }[] = [
  {
    first: { detail: "Bistro Nova", label: "Restaurant" },
    second: { detail: "ul. Długa 12", icon: TbMapPin, label: "Address" },
  },
  {
    first: { detail: "Location selected", icon: TbCircleCheck, label: "Map" },
    second: { detail: "Pin the entrance", icon: TbMapPin, label: "Location" },
  },
  {
    first: { detail: "Contact", icon: TbMail, label: "Restaurant" },
    second: { detail: "123 ••• •••", label: "NIP" },
  },
  {
    first: { detail: "Owner", icon: TbUser, label: "Profile" },
    second: { detail: "Ready to go", icon: TbCircleCheck, label: "Setup" },
  },
] as const;

export const OnboardingFeaturePanel = ({ activeStep, t }: OnboardingFeaturePanelProps): ReactElement => {
  const ActiveIcon = FEATURE_ICONS[activeStep];
  const panelBackgroundColor = PANEL_BACKGROUND_COLORS[activeStep];
  const cloudOnePosition = CLOUD_ONE_POSITIONS[activeStep];
  const cloudTwoPosition = CLOUD_TWO_POSITIONS[activeStep];
  const cloudContent = CLOUD_CONTENT[activeStep];
  const SecondCloudIcon = cloudContent.second.icon;
  const FirstCloudIcon = cloudContent.first.icon;

  return (
    <aside
      className="relative isolate min-h-64 overflow-hidden px-6 py-8 text-white transition-colors duration-700 ease-out lg:min-h-full lg:px-10 lg:py-12"
      data-step={activeStep}
      data-testid="onboarding-feature-panel"
      style={{ backgroundColor: panelBackgroundColor }}
    >
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
          <div className="onboarding-feature-card absolute left-1/2 top-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-white/30 bg-white/25 shadow-2xl lg:size-32">
            <ActiveIcon className="size-11 lg:size-14" />
          </div>
          <div
            className="onboarding-overlay-card absolute rounded-xl border border-white/20 bg-white/20 px-4 py-3 shadow-lg transition-[left,top] duration-700 ease-out"
            data-testid="onboarding-overlay-top-card"
            style={cloudOnePosition}
          >
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-white/55">
              {cloudContent.first.label}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
              {FirstCloudIcon ? <FirstCloudIcon className="size-3.5" /> : null}
              <span>{cloudContent.first.detail}</span>
            </div>
          </div>
          <div
            className="onboarding-overlay-card-reverse absolute rounded-xl border border-white/20 bg-white/20 px-4 py-3 shadow-lg transition-[left,top] duration-700 ease-out"
            data-testid="onboarding-overlay-bottom-card"
            style={cloudTwoPosition}
          >
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-white/55">
              {cloudContent.second.label}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
              {SecondCloudIcon ? <SecondCloudIcon className="size-3.5" /> : null}
              <span>{cloudContent.second.detail}</span>
            </div>
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
