import { useEffect, useRef, useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Download,
  Upload,
  LogOut,
  Heart,
  Check,
  Palette,
} from "../components/icons";
import SegmentedButton from "../components/SegmentedButton";
import TextField from "../components/TextField";
import { todayISO } from "../lib/dateUtils";
import { START_PAGES, getStartPage, setStartPage } from "../lib/startPage";
import {
  FORMATS,
  buildExportBlob,
  downloadBlob,
  entriesToRows,
  activitiesToRows,
  moodsToRows,
  parseImportFile,
  normalizeEntries,
  normalizeActivities,
  normalizeMoods,
} from "../lib/dataTransfer";
import { DEFAULT_ACTIVITIES } from "../lib/moodConfig";
import { useToast } from "../context/ToastContext";
import { useActivities } from "../hooks/useActivities";
import { useMoods } from "../hooks/useMoods";
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
  const { entries, importEntries } = useMoodEntries();
  const { activities, importActivities } = useActivities();
  const { moods, importMoods } = useMoods();
  const { showToast } = useToast();
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const { t, langPref, setLang } = useI18n();
  const [theme, setThemeState] = useState(getStoredTheme());
  const [fontScale, setFontScaleState] = useState(getStoredFontScale());
  const [seed, setSeedState] = useState(getStoredSeed());
  const [startPage, setStartPageState] = useState(getStartPage());
  const [format, setFormat] = useState("csv");
  const [busy, setBusy] = useState(null);
  const fileRef = useRef(null);
  const importTarget = useRef(null);
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

  function handleStartPage(path) {
    setStartPageState(path);
    setStartPage(path);
  }

  const activityById = Object.fromEntries(activities.map((a) => [a.id, a]));

  async function exportDataset(dataset) {
    const rows =
      dataset === "entries"
        ? entriesToRows(entries, activityById)
        : dataset === "activities"
          ? activitiesToRows(activities)
          : moodsToRows(moods);
    if (rows.length === 0) return showToast(t("settings.exportEmpty"));
    setBusy(`export:${dataset}`);
    try {
      const blob = await buildExportBlob(format, dataset, rows);
      const name = `moody-${dataset}-${todayISO()}.${format}`;
      downloadBlob(blob, name);
      showToast(t("settings.exported", { name }));
    } catch {
      showToast(t("settings.exportFailed"));
    } finally {
      setBusy(null);
    }
  }

  function pickImport(dataset) {
    importTarget.current = dataset;
    fileRef.current?.click();
  }

  async function onFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng một file
    const dataset = importTarget.current;
    if (!file || !dataset) return;
    setBusy(`import:${dataset}`);
    try {
      const raw = await parseImportFile(file);
      let parsed;
      if (dataset === "entries") parsed = normalizeEntries(raw, { moods, activities });
      else if (dataset === "activities")
        parsed = normalizeActivities(raw, DEFAULT_ACTIVITIES.map((a) => a.id));
      else parsed = normalizeMoods(raw, moods.map((m) => m.key));
      if (parsed.items.length === 0) return showToast(t("settings.importNothing"));
      let result;
      try {
        result =
          dataset === "entries"
            ? await importEntries(parsed.items)
            : dataset === "activities"
              ? await importActivities(parsed.items)
              : await importMoods(parsed.items);
      } catch {
        return showToast(t("settings.importErr.write"));
      }
      showToast(
        t("settings.importDone", {
          added: result.added ?? 0,
          updated: result.updated ?? 0,
          skipped: parsed.skipped,
        }),
      );
    } catch (err) {
      const known = ["format", "size", "invalid"].includes(err?.message) ? err.message : "read";
      showToast(t(`settings.importErr.${known}`));
    } finally {
      setBusy(null);
    }
  }

  const isPreset = SEED_PRESETS.some((p) => p.hex.toUpperCase() === seed);

  return (
    <div className="page page-enter pb-4">
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
              value={langPref}
              onChange={setLang}
              options={[{ key: "auto", label: t("settings.langAuto") }, ...LANGUAGES]}
            />
            {langPref === "auto" && (
              <p className="t-body-small text-on-surface-variant px-1 mt-2">
                {t("settings.langAutoHint")}
              </p>
            )}
          </SettingGroup>

          <SettingGroup title={t("settings.startPage")}>
            <p className="t-body-medium text-on-surface-variant mb-3 px-1">
              {t("settings.startPageText")}
            </p>
            <TextField
              as="select"
              label={t("settings.startPage")}
              fieldBg="var(--md-surface-container-highest)"
              value={startPage}
              onChange={(e) => handleStartPage(e.target.value)}
            >
              {START_PAGES.map((p) => (
                <option key={p.path} value={p.path}>
                  {t(p.key)}
                </option>
              ))}
            </TextField>
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

          <SettingGroup title={t("settings.exportImport")}>
            <p className="t-body-medium text-on-surface-variant mb-3 px-1">
              {t("settings.dataHint")}
            </p>
            <p className="t-label-medium text-on-surface-variant mb-2 px-1">
              {t("settings.dataFormat")}
            </p>
            <SegmentedButton
              className="mb-4"
              value={format}
              onChange={setFormat}
              options={FORMATS.map((f) => ({ key: f, label: `.${f}` }))}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={onFileChosen}
              className="hidden"
            />
            <div className="space-y-2">
              {["entries", "activities", "moods"].map((ds) => (
                <div key={ds} className="card-filled p-4">
                  <p className="t-title-small mb-3">{t(`settings.dataset.${ds}`)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportDataset(ds)}
                      disabled={!!busy}
                      className="btn btn-outlined state flex-1 justify-center"
                    >
                      <Download size={18} />
                      {t("settings.exportBtn")}
                    </button>
                    <button
                      onClick={() => pickImport(ds)}
                      disabled={!!busy}
                      className="btn btn-tonal state flex-1 justify-center"
                    >
                      <Upload size={18} />
                      {t("settings.importBtn")}
                    </button>
                  </div>
                </div>
              ))}
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
