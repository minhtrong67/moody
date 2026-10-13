import { useEffect, useRef, useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Download,
  Trash2,
  LogOut,
  Heart,
  Check,
  Palette,
} from "../components/icons";
import ConfirmDialog from "../components/ConfirmDialog";
import SegmentedButton from "../components/SegmentedButton";
import { todayISO } from "../lib/dateUtils";
import { useAuth } from "../context/AuthContext";
import { useMoodEntries } from "../hooks/useMoodEntries";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useI18n, LANGUAGES } from "../i18n";
import {
  getStoredTheme,
  getStoredFontScale,
  getStoredSeed,
  setTheme,
  setFontScale,
  setThemeSeed,
  SEED_PRESETS,
  DEFAULT_SEED,
} from "../lib/theme";

const FONT_SIZES = [
  { key: "0.9", size: "13px" },
  { key: "1", size: "15px" },
  { key: "1.15", size: "18px" },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const { entries, deleteEntry } = useMoodEntries();
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const { t, lang, setLang } = useI18n();
  const [theme, setThemeState] = useState(getStoredTheme());
  const [fontScale, setFontScaleState] = useState(getStoredFontScale());
  const [seed, setSeedState] = useState(getStoredSeed());
  const [confirmClear, setConfirmClear] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function handleTheme(value) {
    setThemeState(value);
    setTheme(value);
  }

  function handleFontScale(value) {
    setFontScaleState(value);
    setFontScale(value);
  }

  // Màu chủ đề: bảng màu M3 được sinh lại từ seed (nạp thư viện lười), lưu để lần sau áp ngay.
  function handleSeed(hex, { debounce = false } = {}) {
    setSeedState(hex.toUpperCase());
    clearTimeout(debounceRef.current);
    if (debounce)
      debounceRef.current = setTimeout(() => setThemeSeed(hex), 120);
    else setThemeSeed(hex);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moody-data-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function clearAll() {
    await Promise.all(entries.map((e) => deleteEntry(e.id)));
    setConfirmClear(false);
  }

  const isPreset = SEED_PRESETS.some((p) => p.hex.toUpperCase() === seed);

  return (
    <div className="page page-enter pb-4">
      <ConfirmDialog
        open={confirmClear}
        title={t("settings.clearTitle")}
        description={t("settings.clearText", { n: entries.length })}
        confirmLabel={t("settings.clearConfirm")}
        danger
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
      <h1 className="t-headline-medium mb-6 pt-2">{t("settings.title")}</h1>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-10 lg:items-start">
        <div>
          {user && (
            <div className="flex items-center gap-4 mb-6 card-filled p-4">
              <img
                src={user.photoURL}
                alt=""
                width="48"
                height="48"
                className="w-12 h-12 rounded-full"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="t-title-medium truncate">{user.displayName}</p>
                <p className="t-body-medium text-on-surface-variant truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="btn btn-text-error state shrink-0"
              >
                <LogOut size={18} /> {t("common.logout")}
              </button>
            </div>
          )}

          {canInstall && !installed && (
            <div className="mb-8 bg-primary-container text-on-primary-container rounded-m3-xl p-5 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-surface/60 flex items-center justify-center shrink-0">
                <Smartphone size={24} />
              </span>
              <div className="flex-1">
                <p className="t-title-medium">{t("settings.install")}</p>
                <p className="t-body-medium opacity-80">
                  {t("settings.installText")}
                </p>
              </div>
              <button
                onClick={promptInstall}
                className="btn btn-filled state shrink-0"
              >
                {t("settings.installBtn")}
              </button>
            </div>
          )}

          <SettingGroup title={t("settings.appearance")}>
            <SegmentedButton
              value={theme}
              onChange={handleTheme}
              options={[
                { key: "light", label: t("theme.lightShort"), icon: Sun },
                { key: "dark", label: t("theme.darkShort"), icon: Moon },
                { key: "system", label: t("theme.systemShort"), icon: Monitor },
              ]}
            />
          </SettingGroup>

          <SettingGroup title={t("settings.themeColor")}>
            <div className="card-filled p-4">
              <p className="t-body-medium text-on-surface-variant mb-4">
                {t("settings.themeColorText")}
              </p>
              <div
                className="flex flex-wrap gap-3"
                role="radiogroup"
                aria-label={t("settings.themeColor")}
              >
                {SEED_PRESETS.map((p) => {
                  const selected = seed === p.hex.toUpperCase();
                  return (
                    <button
                      key={p.key}
                      role="radio"
                      aria-checked={selected}
                      aria-label={t(`theme.color.${p.key}`)}
                      title={t(`theme.color.${p.key}`)}
                      onClick={() => handleSeed(p.hex)}
                      className="state w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform duration-200 ease-emphasized active:scale-90"
                      style={{
                        background: p.hex,
                        boxShadow: selected
                          ? `0 0 0 3px rgb(var(--md-surface-container-highest)), 0 0 0 5px ${p.hex}`
                          : "none",
                      }}
                    >
                      {selected && <Check size={20} />}
                    </button>
                  );
                })}
                {/* Màu tùy chọn: hộp chọn màu gốc của trình duyệt */}
                <label
                  title={t("settings.customColor")}
                  className="state relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-on-surface-variant"
                  style={{
                    background: !isPreset
                      ? seed
                      : "conic-gradient(#e8743b, #d9a400, #5bab5b, #00a19b, #769cdf, #8e6fd8, #d86aa8, #e8743b)",
                    boxShadow: !isPreset
                      ? `0 0 0 3px rgb(var(--md-surface-container-highest)), 0 0 0 5px ${seed}`
                      : "none",
                  }}
                >
                  {!isPreset ? (
                    <Check size={20} className="text-white" />
                  ) : (
                    <Palette size={20} className="text-white drop-shadow" />
                  )}
                  <input
                    type="color"
                    value={seed}
                    onChange={(e) =>
                      handleSeed(e.target.value, { debounce: true })
                    }
                    aria-label={t("settings.customColor")}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>
              {seed !== DEFAULT_SEED && (
                <button
                  onClick={() => handleSeed(DEFAULT_SEED)}
                  className="btn btn-text state mt-3 -ml-3"
                >
                  {t("settings.resetColor")}
                </button>
              )}
            </div>
          </SettingGroup>

          <SettingGroup title={t("settings.language")}>
            <SegmentedButton
              value={lang}
              onChange={setLang}
              options={LANGUAGES}
            />
          </SettingGroup>
        </div>

        <div>
          <SettingGroup title={t("settings.fontSize")}>
            <div className="segmented" role="group">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={fontScale === f.key}
                  onClick={() => handleFontScale(f.key)}
                  className="state"
                >
                  <span className="font-semibold" style={{ fontSize: f.size }}>
                    A
                  </span>
                  <span className="t-label-medium">
                    {t(`settings.font.${f.key}`)}
                  </span>
                </button>
              ))}
            </div>
          </SettingGroup>

          <SettingGroup title={t("settings.data")}>
            <div className="space-y-2">
              <button
                onClick={exportData}
                className="btn btn-outlined btn-block state justify-center"
              >
                <Download size={18} />
                {t("settings.export")}
              </button>
              <p className="t-body-small text-on-surface-variant px-1">
                {t("settings.importHint")}
              </p>
              <button
                onClick={() => setConfirmClear(true)}
                disabled={entries.length === 0}
                className="btn btn-error-tonal btn-block state justify-center"
              >
                <Trash2 size={18} />
                {t("settings.clear")}
              </button>
            </div>
          </SettingGroup>

          <div className="card-outlined p-4 flex items-center gap-4">
            <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <Heart size={20} />
            </span>
            <div className="t-body-medium text-on-surface-variant">
              <p className="t-title-small text-on-surface mb-0.5">Moody</p>
              <p>{t("settings.credit", { author: "minhtrong67" })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingGroup({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="t-title-small text-primary mb-3 px-1">{title}</h2>
      {children}
    </section>
  );
}
