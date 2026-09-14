/** Public share links for the companion site and store listings. */

export const SITE_URL = "https://olympus-dominoes.kbueno-studio.com/";

export const IOS_APP_URL =
  "https://apps.apple.com/us/app/olympus-dominoes/id6799737142";

/** Set when the Play Store listing ships. Until then the home Android CTA stays disabled. */
export const ANDROID_APP_URL: string | null = null;

/** Sideload APK served at this path (local `public/` or production GitHub Release). */
export const ANDROID_APK_PATH = "/downloads/olympus-dominoes.v4.9.apk";
export const ANDROID_APK_FILENAME = "olympus-dominoes.v4.9.apk";
export const ANDROID_APK_RELEASE_URL =
  "https://github.com/Kbueno1077/olympus-dominoes/releases/download/android-4.9/olympus-dominoes.v4.9.apk";

export function androidApkHref(origin?: string | null): string {
  const base = (origin || SITE_URL).replace(/\/$/, "");
  return `${base}${ANDROID_APK_PATH}`;
}
