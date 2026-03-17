import { redirect } from "next/navigation";

// export default async function RootPage(): Promise<never> {
export default function RootPage(): never {
  // const detectedLocale = await getLocale();
  // const targetLocale = hasLocale(routing.locales, detectedLocale) ? detectedLocale : routing.defaultLocale;
  // redirect(`/${targetLocale}`);
  redirect("/pl");
}
