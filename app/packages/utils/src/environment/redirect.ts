import { type EnvironmentType } from "@restorio/types";

import { getAppUrl } from "./appUrls";

export const redirectTo = (envName: EnvironmentType): string => getAppUrl(envName, "public-web");
