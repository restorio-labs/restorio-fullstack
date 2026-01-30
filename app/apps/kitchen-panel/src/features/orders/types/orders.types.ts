export interface StatusConfig {
  label: string;
  ariaLabel: string;
  indicatorClassName: string;
  iconClassName: string;
  iconKey: "add" | "clock" | "check";
}

export interface DropZone {
  id: string;
  label: string;
  iconPath: React.ReactNode;
  className: string;
}
