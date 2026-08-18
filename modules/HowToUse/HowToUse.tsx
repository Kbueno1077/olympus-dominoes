"use client";

import { APP_UI_SIGNATURE } from "@/lib/analytics/dbMeta";
import { useTranslation } from "@/i18n/useTranslation";
import Link from "next/link";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/olympus-dominoes/id6799737142";

const HOW_STEPS = [
  { title: "howStep1Title", body: "howStep1Body" },
  { title: "howStep2Title", body: "howStep2Body" },
  { title: "howStep3Title", body: "howStep3Body" },
] as const;

const PAGES = [
  { href: "/play", nav: "navPlay", body: "howToUsePagePlay" },
  { href: "/match", nav: "navMatch", body: "howToUsePageMatch" },
  { href: "/history", nav: "historyNav", body: "howToUsePageHistory" },
  { href: "/stats", nav: "statsNav", body: "howToUsePageStats" },
  { href: "/leaderboard", nav: "leaderboardNav", body: "howToUsePageLeaderboard" },
  { href: "/compare", nav: "compareNav", body: "howToUsePageCompare" },
  { href: "/podium", nav: "podiumNav", body: "howToUsePagePodium" },
] as const;

const linkClass =
  "underline decoration-[rgb(var(--border))] underline-offset-2 hover:text-[rgb(var(--primary))]";

export default function HowToUse() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-6 text-sm text-[rgb(var(--text-muted))]">
        <Link href="/" className={linkClass}>
          ← Olympus Dominoes
        </Link>
      </p>

      <article className="space-y-8 text-[rgb(var(--text))]">
        <header className="space-y-2 border-b border-[rgb(var(--border))] pb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("howToUseTitle")}
          </h1>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            {t("howToUseIntro")}
          </p>
          <p className="text-xs font-medium tracking-wide text-[rgb(var(--text-muted))]">
            {APP_UI_SIGNATURE}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("howToUseWebTitle")}</h2>
          <h3 className="text-lg font-medium">{t("howToUseSaveTitle")}</h3>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            {t("howToUseSaveBody")}
          </p>
          <h3 className="text-lg font-medium">{t("howToUseNotepadTitle")}</h3>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            {t("howToUseNotepadBody")}
          </p>
          <ol className="list-decimal space-y-2 pl-5 leading-relaxed text-[rgb(var(--text-muted))]">
            {HOW_STEPS.map((step) => (
              <li key={step.title}>
                <span className="font-medium text-[rgb(var(--text))]">
                  {t(step.title)}
                </span>
                {` — ${t(step.body)}`}
              </li>
            ))}
          </ol>
          <h3 className="text-lg font-medium">{t("howToUsePlayTitle")}</h3>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            {t("howToUsePlayBody")}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("howToUsePhoneTitle")}</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            {t("howToUsePhoneBody")}
          </p>
          <p>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {t("homeAppStore")}
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("howToUsePagesTitle")}</h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-[rgb(var(--text-muted))]">
            {PAGES.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className={linkClass}>
                  {t(page.nav)}
                </Link>
                {` — ${t(page.body)}`}
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-2 border-t border-[rgb(var(--border))] pt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
            {t("howToUseJoseNoteLabel")}
          </p>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            {t("howToUseJoseNote")}
          </p>
        </aside>
      </article>
    </div>
  );
}
