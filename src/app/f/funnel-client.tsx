"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface FunnelOption {
  id: string;
  screenId: string;
  icon: string | null;
  label: string;
  description: string | null;
  value: string;
  sortOrder: number;
  style: string | null;
  condition: string | null;
}

interface FunnelScreen {
  id: string;
  stepLabel: string | null;
  title: string;
  subtitle: string | null;
  hint: string | null;
  selectMode: string;
  buttonText: string | null;
  sortOrder: number;
  extraContent: string | null;
  options: FunnelOption[];
}

interface Firm {
  id: string;
  name: string;
  package: string;
  premiums: string;
}

interface Props {
  screens: FunnelScreen[];
  firms: Firm[];
  settings: { familyDiscount: number; newBizDiscount: number } | null;
}

const QUESTION_SCREENS = ["sPreg", "s1", "s2", "s3", "s4", "s5", "s6"];
const FLOW = ["s0", "sPreg", "s1", "s2", "s3", "s4", "s5", "s6", "sLoad", "sPhone", "sResult", "sSuccess"];

const FIRM_COLORS: Record<string, { bg: string; fg: string }> = {
  "Doğa Sigorta": { bg: "#F3E5F5", fg: "#4A148C" },
  "Zurich Sigorta": { bg: "#E1F0FA", fg: "#0077C8" },
  "Demir Sigorta": { bg: "#E8F5E9", fg: "#1B5E20" },
  "Ana Sigorta": { bg: "#FCE4EC", fg: "#AD1457" },
  "Ankara Sigorta": { bg: "#FFF3E0", fg: "#E65100" },
  "MetLife": { bg: "#E3F2FD", fg: "#0D47A1" },
  "AK Sigorta": { bg: "#EDE7F6", fg: "#4527A0" },
  "Ray Sigorta": { bg: "#ECEFF1", fg: "#37474F" },
  "Türkiye Sigorta": { bg: "#FFF3E0", fg: "#E65100" },
  "Sompo Sigorta": { bg: "#E0F7FA", fg: "#006064" },
  "Anadolu Sigorta": { bg: "#FBE9E7", fg: "#BF360C" },
  "HDI Sigorta": { bg: "#E8F5E9", fg: "#2E7D32" },
  "Quick Sigorta": { bg: "#FFFDE7", fg: "#F57F17" },
};

export default function FunnelClient({ screens, firms, settings }: Props) {
  const [currentScreen, setCurrentScreen] = useState("s0");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+90");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [loadStep, setLoadStep] = useState(-1);
  const [savings, setSavings] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sessionId = useRef(`TSS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`);

  const screenMap = new Map(screens.map((s) => [s.id, s]));
  const screen = screenMap.get(currentScreen);

  const stepIndex = FLOW.indexOf(currentScreen);
  const questionSteps = FLOW.filter((id) => QUESTION_SCREENS.includes(id));
  const currentQuestionIdx = questionSteps.indexOf(currentScreen);
  const progressPct = currentQuestionIdx >= 0 ? Math.round(((currentQuestionIdx + 1) / questionSteps.length) * 100) : 0;

  function go(id: string) {
    setCurrentScreen(id);
    setMultiSel(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
    // webhook
    fetch("/api/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "step", sessionId: sessionId.current, data: { step: id } }),
    }).catch(() => {});
  }

  function pickSingle(screenId: string, value: string) {
    setAnswers((a) => ({ ...a, [screenId]: value }));
    // Navigate based on screen
    const idx = FLOW.indexOf(screenId);
    if (screenId === "sPreg") {
      if (value === "aktif") { go("sPregRedirect"); return; }
      go("s1");
      return;
    }
    if (screenId === "s6") { runLoading(); return; }
    if (idx >= 0 && idx < FLOW.length - 1) {
      setTimeout(() => go(FLOW[idx + 1]), 300);
    }
  }

  function toggleMulti(value: string) {
    setMultiSel((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }

  function submitMulti(screenId: string) {
    setAnswers((a) => ({ ...a, [screenId]: Array.from(multiSel) }));
    const idx = FLOW.indexOf(screenId);
    if (idx >= 0 && idx < FLOW.length - 1) go(FLOW[idx + 1]);
  }

  // Loading animation
  const runLoading = useCallback(() => {
    go("sLoad");
    let step = 0;
    const iv = setInterval(() => {
      setLoadStep(step);
      step++;
      if (step > 4) {
        clearInterval(iv);
        // Calculate savings
        const famMap: Record<string, number> = { tek: 8200, cift: 14400, aile3: 21800, aile4: 31200 };
        const fam = (answers.s1 as string) || "aile3";
        const base = famMap[fam] || 21800;
        const s = Math.round((base * (1 + Math.random() * 0.8)) / 100) * 100;
        setSavings(Math.min(s, 95000));
        // Send lead data
        fetch("/api/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "lead",
            sessionId: sessionId.current,
            data: {
              ageGroup: answers.s2,
              familyType: answers.s1,
              lifestyle: answers.s3,
              insurance: answers.s4,
              risks: answers.s5,
              chronicCondition: answers.s6,
              pregnancyStatus: answers.sPreg,
              estimatedSavings: s,
            },
          }),
        }).catch(() => {});
        setTimeout(() => go("sPhone"), 600);
      }
    }, 700);
  }, [answers]); // eslint-disable-line react-hooks/exhaustive-deps

  function sendOtp() {
    if (phone.replace(/\s/g, "").length < 10) return;
    setOtpSent(true);
    // Send phone to lead
    fetch("/api/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "lead",
        sessionId: sessionId.current,
        data: { phone: countryCode + phone.replace(/\s/g, "") },
      }),
    }).catch(() => {});
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }

  function handleOtp(idx: number, val: string) {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 3) otpRefs.current[idx + 1]?.focus();
    if (next.every((d) => d)) {
      setTimeout(() => go("sResult"), 300);
    }
  }

  function handleOtpKey(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function openWhatsApp() {
    const msg = encodeURIComponent(
      `🛡 TSS TASARRUF RAPORU\nOturum: ${sessionId.current}\nTahmini Tasarruf: ₺${savings.toLocaleString("tr")}\nMerhaba, TSS hesaplayıcısını doldurdum. Teklif almak istiyorum.`
    );
    window.open(`https://wa.me/905398570016?text=${msg}`, "_blank");
    setTimeout(() => go("sSuccess"), 800);
  }

  if (!screen) return <div className="p-8 text-center text-gray-400">Ekran bulunamadı</div>;

  const extra = screen.extraContent ? JSON.parse(screen.extraContent) : null;

  return (
    <div>
      {/* Topbar */}
      <div className="sticky top-0 z-50 bg-white/97 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-[680px] mx-auto px-5 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#201652] to-[#1A3A9C] flex items-center justify-center text-sm shadow">🛡</div>
            <span className="font-bold text-[#0D297B] text-sm tracking-tight">Timurlar Sigorta</span>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-[11px] font-bold text-green-600">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Canlı
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {QUESTION_SCREENS.includes(currentScreen) && (
        <div className="bg-white border-b border-gray-200 py-2.5 px-5">
          <div className="max-w-[680px] mx-auto">
            <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1.5">
              <span>{currentQuestionIdx >= 0 ? `Adım ${currentQuestionIdx + 1} / ${questionSteps.length}` : ""}</span>
              <span>%{progressPct}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0D297B] to-[#1A3A9C] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-[680px] mx-auto px-5 py-7 pb-24">
        <div key={currentScreen} className="animate-[rise_0.35s_ease]">

          {/* ─── INTRO (s0) ─── */}
          {currentScreen === "s0" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-br from-[#201652] via-[#0D297B] to-[#1A3A9C] p-8 pb-6 text-white relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-52 h-52 bg-white/5 rounded-full" />
                <div className="absolute bottom-[-40px] left-8 w-36 h-36 bg-white/3 rounded-full" />
                <div className="inline-flex items-center gap-1.5 bg-white/12 border border-white/20 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase mb-4">
                  🛡 TSS HESAPLAYICI
                </div>
                <h1 className="text-[1.9rem] font-bold leading-tight mb-2.5 relative z-10">
                  {screen.title.includes("tasarruf") ? (
                    <>TSS ile yılda ne kadar <em className="italic text-[#7EE8C3]">tasarruf</em> edersiniz?</>
                  ) : screen.title}
                </h1>
                <p className="text-sm text-white/80 leading-relaxed max-w-md relative z-10">{screen.subtitle}</p>
                <div className="flex gap-2 flex-wrap mt-4 relative z-10">
                  <span className="bg-white/12 border border-white/18 rounded-full px-3 py-1 text-[11px] font-semibold text-white/90">⚡ 2 dakikada hesapla</span>
                  <span className="bg-white/12 border border-white/18 rounded-full px-3 py-1 text-[11px] font-semibold text-white/90">🏥 850+ hastane</span>
                  <span className="bg-white/12 border border-white/18 rounded-full px-3 py-1 text-[11px] font-semibold text-white/90">📋 10+ firma</span>
                </div>
              </div>
              {/* Intro image */}
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=680&q=80&auto=format&fit=crop"
                alt="Sağlık sigortası"
                className="w-full h-[160px] object-cover object-center"
              />
              <div className="p-6">
                {extra?.stats && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {extra.stats.map((s: { value: string; label: string }, i: number) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-[#0D297B]">{s.value}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => go("sPreg")}
                  className="w-full bg-[#0D297B] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#201652] hover:-translate-y-0.5 transition-all text-sm"
                >
                  {screen.buttonText || "Hesaplamaya Başla →"}
                </button>
                {extra?.trustItems && (
                  <div className="flex gap-4 justify-center mt-4 flex-wrap">
                    {extra.trustItems.map((t: string, i: number) => (
                      <span key={i} className="text-[11px] text-gray-400 flex items-center gap-1">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── QUESTION SCREENS ─── */}
          {QUESTION_SCREENS.includes(currentScreen) && currentScreen !== "sPreg" && (
            <div>
              {screen.stepLabel && (
                <div className="text-[11px] font-bold tracking-widest uppercase text-[#0D297B] mb-2">{screen.stepLabel}</div>
              )}
              <h2 className="text-xl font-bold text-[#201652] leading-tight mb-1.5">{screen.title}</h2>
              {screen.subtitle && <p className="text-sm text-gray-500 leading-relaxed mb-6">{screen.subtitle}</p>}

              <div className="flex flex-col gap-2.5">
                {screen.options.map((opt) => {
                  const isSel = screen.selectMode === "multi"
                    ? multiSel.has(opt.value)
                    : answers[currentScreen] === opt.value;
                  const optStyle = opt.style ? JSON.parse(opt.style) : null;

                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        screen.selectMode === "multi"
                          ? toggleMulti(opt.value)
                          : pickSingle(currentScreen, opt.value)
                      }
                      className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                        isSel
                          ? "border-[#0D297B] bg-[#EEF1FB] translate-x-1"
                          : "border-gray-200 bg-white hover:border-[#1A3A9C] hover:bg-[#EEF1FB] hover:translate-x-1"
                      }`}
                      style={optStyle ? { borderColor: isSel ? optStyle.borderColor : undefined, background: isSel ? optStyle.background : undefined } : undefined}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${isSel ? "bg-[#D6DEFF]" : "bg-gray-50"}`}>
                        {opt.icon || "⬜"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[#201652]">{opt.label}</div>
                        {opt.description && <div className="text-xs text-gray-500">{opt.description}</div>}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] shrink-0 ${
                        isSel ? "bg-[#0D297B] border-[#0D297B] text-white" : "border-gray-300 text-transparent"
                      }`}>
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>

              {screen.selectMode === "multi" && (
                <button
                  onClick={() => submitMulti(currentScreen)}
                  disabled={multiSel.size === 0}
                  className="w-full mt-6 bg-[#0D297B] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#201652] transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {screen.buttonText || "Devam Et →"}
                </button>
              )}

              {screen.hint && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[13px] text-amber-800 leading-relaxed">
                  {screen.hint}
                </div>
              )}
            </div>
          )}

          {/* ─── PREGNANCY PRE-SCREEN ─── */}
          {currentScreen === "sPreg" && (
            <div>
              <h2 className="text-xl font-bold text-[#201652] mb-1.5">{screen.title}</h2>
              {screen.subtitle && <p className="text-sm text-gray-500 leading-relaxed mb-6">{screen.subtitle}</p>}
              <div className="flex flex-col gap-2.5">
                {screen.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => pickSingle("sPreg", opt.value)}
                    className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 bg-white text-left hover:border-[#1A3A9C] hover:bg-[#EEF1FB] hover:translate-x-1 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl shrink-0">{opt.icon}</div>
                    <div className="flex-1"><div className="font-bold text-sm text-[#201652]">{opt.label}</div>{opt.description && <div className="text-xs text-gray-500">{opt.description}</div>}</div>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
              {screen.hint && <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[13px] text-amber-800">{screen.hint}</div>}
            </div>
          )}

          {/* ─── PREG REDIRECT ─── */}
          {currentScreen === "sPregRedirect" && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl p-6 text-center">
              <h2 className="text-xl font-bold text-purple-800 mb-3">{screen.title}</h2>
              <p className="text-sm text-purple-700 leading-relaxed mb-5">{screen.subtitle}</p>
              {extra?.costs && (
                <div className="bg-white rounded-xl p-4 mb-5 border border-purple-200">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Doğum Masrafları</div>
                  <div className="text-xs text-gray-600">Normal doğum: <strong>{extra.costs.normalBirth}</strong></div>
                  <div className="text-xs text-gray-600">Sezaryen: <strong>{extra.costs.cesarean}</strong></div>
                  {extra.coverageNote && <div className="text-xs text-green-700 mt-2 font-medium">{extra.coverageNote}</div>}
                </div>
              )}
              <button onClick={() => go("s1")} className="w-full bg-purple-700 text-white font-bold py-3 rounded-xl hover:bg-purple-800 transition-all text-sm">
                Normal Hesaplayıcıya Devam Et →
              </button>
            </div>
          )}

          {/* ─── LOADING ─── */}
          {currentScreen === "sLoad" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="w-16 h-16 border-3 border-gray-200 border-t-[#0D297B] rounded-full animate-spin" />
                <div className="absolute inset-3 bg-[#EEF1FB] rounded-full flex items-center justify-center text-2xl">🧮</div>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{screen.title}</h2>
              <p className="text-sm text-gray-500 mb-6">{screen.subtitle}</p>
              {extra?.steps && (
                <ul className="max-w-xs mx-auto text-left space-y-2">
                  {extra.steps.map((s: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600 border-b border-gray-100 pb-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-all ${
                        i < loadStep ? "bg-[#0D297B] text-white" : i === loadStep ? "bg-[#1A3A9C] animate-pulse" : "bg-gray-200"
                      }`}>
                        {i < loadStep ? "✓" : ""}
                      </div>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ─── PHONE ─── */}
          {currentScreen === "sPhone" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1585435557343-3b092031a831?w=480&q=80&auto=format&fit=crop"
                alt="Güvenli doğrulama"
                className="w-full h-[140px] object-cover object-[center_top]"
              />
              <div className="p-6">
              <h2 className="text-lg font-bold text-[#201652] mb-1.5">{screen.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{screen.subtitle}</p>

              {!otpSent ? (
                <>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Telefon Numaranız</label>
                  <div className="flex gap-2">
                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-20 border-2 border-gray-200 rounded-lg px-2 py-3 text-sm">
                      <option value="+90">🇹🇷 +90</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+1">🇺🇸 +1</option>
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="5XX XXX XX XX"
                      maxLength={11}
                      className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-3 text-sm focus:border-[#0D297B] outline-none"
                    />
                  </div>
                  <button onClick={sendOtp} className="w-full mt-4 bg-[#0D297B] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#201652] transition-all text-sm">
                    {screen.buttonText || "Doğrulama Kodu Gönder 📲"}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center text-3xl mb-3">💬</div>
                  <h3 className="text-base font-bold text-center mb-1">{extra?.otpTitle || "Doğrulama kodunu girin"}</h3>
                  <p className="text-sm text-gray-500 text-center mb-5">{countryCode} {phone} numarasına kod gönderildi. (Demo: herhangi 4 hane)</p>
                  <div className="flex gap-2 justify-center mb-4">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        value={d}
                        onChange={(e) => handleOtp(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKey(i, e)}
                        maxLength={1}
                        className="w-12 h-14 border-2 border-gray-200 rounded-lg text-center text-xl font-bold text-[#0D297B] focus:border-[#0D297B] outline-none"
                      />
                    ))}
                  </div>
                  <button onClick={() => go("sResult")} className="w-full bg-[#0D297B] text-white font-bold py-4 rounded-xl shadow-lg text-sm">
                    {extra?.otpButton || "Kodu Onayla & Raporu Gör ✅"}
                  </button>
                </>
              )}
            </div>
            </div>
          )}

          {/* ─── RESULT ─── */}
          {currentScreen === "sResult" && (
            <div>
              {/* Hero */}
              <div className="bg-gradient-to-br from-[#201652] via-[#0D297B] to-[#1A3A9C] rounded-2xl p-7 text-white text-center mb-5 shadow-xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
                <div className="absolute bottom-[-30px] left-[-30px] w-28 h-28 bg-white/4 rounded-full" />
                {extra?.badge && <div className="inline-block bg-white/12 border border-white/20 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider mb-3 relative z-10">{extra.badge}</div>}
                <h2 className="text-sm font-bold opacity-90 mb-1 relative z-10">{screen.title}</h2>
                <div className="text-[3.5rem] font-bold text-[#7EE8C3] my-2 relative z-10 tracking-tight">₺{savings.toLocaleString("tr")}</div>
                <div className="text-sm opacity-70 relative z-10">{screen.subtitle}</div>
              </div>

              {/* Hero image */}
              <img
                src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=680&q=80&auto=format&fit=crop"
                alt="Sağlıklı aile"
                className="w-full h-[180px] object-cover object-[center_30%] rounded-2xl mb-5 shadow-md"
              />

              {/* Before/After Comparison */}
              {extra?.comparison && (
                <>
                  <h3 className="font-bold text-base text-[#201652] flex items-center gap-2 mb-3">✨ TSS Öncesi vs TSS Sonrası Hayat</h3>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden mb-5">
                    {/* Header tabs */}
                    <div className="grid grid-cols-2">
                      <div className="bg-red-50 text-red-800 text-center py-2.5 text-xs font-bold border-b-3 border-red-400">😰 TSS Olmadan</div>
                      <div className="bg-green-50 text-green-800 text-center py-2.5 text-xs font-bold border-b-3 border-green-400">😊 TSS ile</div>
                    </div>
                    {/* Before/After photos */}
                    <div className="grid grid-cols-[1fr_40px_1fr] items-center p-4 gap-1 bg-gray-50">
                      <div className="flex justify-center">
                        <img src="https://images.unsplash.com/photo-1604881991720-f91add269bed?w=300&q=80&auto=format&fit=crop&crop=top" alt="Stresli" className="w-full max-w-[140px] h-[160px] object-cover object-top rounded-xl border-3 border-red-200 saturate-[0.7]" />
                      </div>
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#0D297B] text-white text-[10px] font-black flex items-center justify-center shadow-md">VS</div>
                      </div>
                      <div className="flex justify-center">
                        <img src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=300&q=80&auto=format&fit=crop&crop=top" alt="Mutlu ve sağlıklı" className="w-full max-w-[140px] h-[160px] object-cover object-top rounded-xl border-3 border-green-200" />
                      </div>
                    </div>
                    {/* Comparison rows */}
                    <div className="divide-y divide-gray-100">
                      {extra.comparison.map((c: { icon: string; label: string; before: string; after: string }, i: number) => (
                        <div key={i} className="grid grid-cols-[1fr_28px_1fr] items-center gap-1 px-3">
                          <div className="p-2.5 bg-red-50 rounded-lg my-1">
                            <div className="text-lg mb-0.5">{c.icon}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">{c.label}</div>
                            <div className="text-xs font-bold text-red-700">{c.before}</div>
                          </div>
                          <div className="flex justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#0D297B] text-white text-xs flex items-center justify-center">→</div>
                          </div>
                          <div className="p-2.5 bg-green-50 rounded-lg my-1">
                            <div className="text-lg mb-0.5">✅</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">{c.label}</div>
                            <div className="text-xs font-bold text-green-700">{c.after}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* CTA strip */}
                    <div className="bg-gradient-to-r from-[#201652] to-[#0D297B] py-3 text-center text-white text-sm font-bold">
                      Sen de bu dönüşümü yaşa ↓
                    </div>
                  </div>
                </>
              )}

              {/* KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { icon: "🔪", value: "%100", label: "Ameliyat karşılanma" },
                  { icon: "🩺", value: "8-12", label: "Yıllık muayene hakkı" },
                  { icon: "🔬", value: "Ücretsiz", label: "Tahlil & MR tetkikleri" },
                  { icon: "💊", value: "Ücretsiz", label: "Yıllık check-up hediye" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-3.5 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="text-xl mb-1">{kpi.icon}</div>
                    <div className="text-lg font-bold text-[#0D297B]">{kpi.value}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Area Chart - Harcama Karşılaştırması */}
              <h3 className="font-bold text-base text-[#201652] flex items-center gap-2 mb-3">📊 Harcama Kalemi Karşılaştırması</h3>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-5">
                <div className="text-xs font-semibold text-gray-500 mb-4">TSS Olmadan vs TSS ile — Yıllık Maliyet (₺)</div>
                <svg viewBox="0 0 560 240" className="w-full overflow-visible">
                  <defs>
                    <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gNavy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D297B" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#0D297B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  {/* Grid */}
                  <line x1="64" y1="20" x2="64" y2="200" stroke="#E5E7EB" strokeWidth="1" />
                  <line x1="64" y1="200" x2="545" y2="200" stroke="#E5E7EB" strokeWidth="1" />
                  {[56, 96, 136, 176].map((y) => (
                    <line key={y} x1="64" y1={y} x2="545" y2={y} stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4,3" />
                  ))}
                  {/* Y labels */}
                  {[{ y: 24, t: "₺35K" }, { y: 60, t: "₺26K" }, { y: 100, t: "₺17K" }, { y: 140, t: "₺9K" }, { y: 180, t: "₺2K" }].map((l) => (
                    <text key={l.y} x="58" y={l.y} textAnchor="end" fontSize="9" fill="#9CA3AF" fontFamily="sans-serif">{l.t}</text>
                  ))}
                  {/* X labels */}
                  {[{ x: 145, t: "Ameliyat" }, { x: 265, t: "Muayene" }, { x: 385, t: "İlaç" }, { x: 505, t: "Diş" }].map((l) => (
                    <text key={l.x} x={l.x} y="218" textAnchor="middle" fontSize="9.5" fill="#374151" fontFamily="sans-serif" fontWeight="600">{l.t}</text>
                  ))}
                  {/* Red area + line */}
                  <path fill="url(#gRed)" d="M64,200 L145,200 C170,200 130,22 145,22 C195,22 225,102 265,102 C305,102 340,122 385,122 C430,122 460,68 505,68 L545,200 Z" />
                  <path fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" d="M145,22 C195,22 225,102 265,102 C305,102 340,122 385,122 C430,122 460,68 505,68" />
                  {/* Navy area + line */}
                  <path fill="url(#gNavy)" d="M64,200 L145,200 C170,200 125,184 145,184 C195,184 225,196 265,196 C305,196 340,193 385,193 C430,193 460,187 505,187 L545,200 Z" />
                  <path fill="none" stroke="#0D297B" strokeWidth="2.5" strokeLinecap="round" d="M145,184 C195,184 225,196 265,196 C305,196 340,193 385,193 C430,193 460,187 505,187" />
                  {/* Savings area */}
                  <path fill="#01BB77" opacity={0.08} d="M145,22 C195,22 225,102 265,102 C305,102 340,122 385,122 C430,122 460,68 505,68 C460,87 430,187 505,187 C460,193 340,193 385,193 C340,193 305,196 265,196 C225,196 195,184 145,184 Z" />
                  {/* Red dots + labels */}
                  {[{ x: 145, y: 22, t: "₺35K" }, { x: 265, y: 102, t: "₺8.4K" }, { x: 385, y: 122, t: "₺6K" }, { x: 505, y: 68, t: "₺12K" }].map((d) => (
                    <g key={d.x}>
                      <circle cx={d.x} cy={d.y} r="4.5" fill="white" stroke="#EF4444" strokeWidth="2" />
                      <text x={d.x} y={d.y - 9} textAnchor="middle" fontSize="9" fontWeight="700" fill="#EF4444" fontFamily="sans-serif">{d.t}</text>
                    </g>
                  ))}
                  {/* Navy dots + labels */}
                  {[{ x: 145, y: 184, t: "₺3.5K" }, { x: 265, y: 196, t: "₺840" }, { x: 385, y: 193, t: "₺1.2K" }, { x: 505, y: 187, t: "₺2.4K" }].map((d) => (
                    <g key={d.x}>
                      <circle cx={d.x} cy={d.y} r="4.5" fill="white" stroke="#0D297B" strokeWidth="2" />
                      <text x={d.x} y={d.y + (d.y > 190 ? 14 : -9)} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0D297B" fontFamily="sans-serif">{d.t}</text>
                    </g>
                  ))}
                  {/* Savings callout */}
                  <line x1="325" y1="110" x2="325" y2="194" stroke="#01BB77" strokeWidth="1.5" strokeDasharray="3,2" />
                  <circle cx="325" cy="110" r="2.5" fill="#01BB77" />
                  <circle cx="325" cy="194" r="2.5" fill="#01BB77" />
                  <rect x="330" y="142" width="42" height="20" rx="4" fill="#01BB77" />
                  <text x="351" y="156" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="sans-serif">%90 az</text>
                </svg>
                {/* Legend */}
                <div className="flex gap-5 mt-3 text-[11px] text-gray-500 justify-center flex-wrap">
                  <div className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-red-500 rounded-full inline-block" /> TSS Olmadan</div>
                  <div className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-[#0D297B] rounded-full inline-block" /> TSS ile</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500/60 rounded-sm inline-block" /> Tasarruf alanı</div>
                </div>
              </div>

              {/* Donut Chart - Bütçe Dağılımı */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-5">
                <div className="text-xs font-semibold text-gray-500 mb-4">Toplam sağlık bütçenizin dağılımı (TSS ile)</div>
                <div className="flex items-center gap-5 flex-wrap">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="18" />
                    {/* %80 sigorta = 251.2 of 314 */}
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#0D297B" strokeWidth="18" strokeLinecap="round"
                      strokeDasharray="251.2 62.8" transform="rotate(-90 60 60)" />
                    {/* %12 katılım = 37.7 */}
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#F59E0B" strokeWidth="18" strokeLinecap="round"
                      strokeDasharray="37.7 276.3" strokeDashoffset="-251.2" transform="rotate(-90 60 60)" />
                    {/* %8 cep = 25.1 */}
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#0EA5E9" strokeWidth="18" strokeLinecap="round"
                      strokeDasharray="25.1 288.9" strokeDashoffset="-288.9" transform="rotate(-90 60 60)" />
                    <text x="60" y="55" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0D297B" fontFamily="sans-serif">%80</text>
                    <text x="60" y="69" textAnchor="middle" fontSize="8" fill="#6B7280" fontFamily="sans-serif">karşılandı</text>
                  </svg>
                  <div className="flex-1 min-w-[160px] space-y-2.5">
                    {[
                      { color: "#0D297B", label: "Sigorta karşılar", value: "%80" },
                      { color: "#F59E0B", label: "Katılım payı", value: "%12" },
                      { color: "#0EA5E9", label: "Cebinizden", value: "%8" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: item.color }} />
                        <span className="text-xs text-gray-700 flex-1">{item.label}</span>
                        <span className="text-xs font-bold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detaylı Karşılaştırma Tablosu */}
              <h3 className="font-bold text-base text-[#201652] flex items-center gap-2 mb-3">📋 Detaylı Karşılaştırma</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-5 shadow-sm">
                <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-[#201652]">
                  <div className="px-3.5 py-2.5 text-[11px] font-bold text-white/85">Kalem</div>
                  <div className="px-3.5 py-2.5 text-[11px] font-bold text-white/85 text-center">TSS Olmadan</div>
                  <div className="px-3.5 py-2.5 text-[11px] font-bold text-white/85 text-center">TSS ile</div>
                </div>
                {[
                  { item: "🔪 Ameliyat masrafı", bad: "₺50.000+", good: "Ücretsiz" },
                  { item: "🩺 Yıllık muayene", bad: "₺15.000+", good: "₺60 katılım payı" },
                  { item: "🔬 Tahlil / MR / Tetkik", bad: "₺3.000–₺8.000", good: "Ücretsiz" },
                  { item: "🦷 Diş bakımı", bad: "Kapsam dışı", good: "Diş temizleme hediye 🎁" },
                  { item: "💊 Check-up", bad: "₺4.000–₺8.000", good: "Ücretsiz hediye 🎁" },
                ].map((row, i) => (
                  <div key={i} className={`grid grid-cols-[1.5fr_1fr_1fr] border-t border-gray-100 ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                    <div className="px-3.5 py-2.5 text-xs font-semibold text-[#201652]">{row.item}</div>
                    <div className="px-3.5 py-2.5 text-xs font-bold text-red-500 text-center">{row.bad}</div>
                    <div className="px-3.5 py-2.5 text-xs font-bold text-green-600 text-center bg-green-50/50">{row.good}</div>
                  </div>
                ))}
                <div className="grid grid-cols-[1.5fr_1fr_1fr] border-t border-gray-200 bg-green-50">
                  <div className="px-3.5 py-2.5 text-xs font-extrabold text-green-700">SONUÇ</div>
                  <div className="px-3.5 py-2.5 text-xs font-extrabold text-red-500 text-center">₺70.000+ risk</div>
                  <div className="px-3.5 py-2.5 text-xs font-extrabold text-green-700 text-center">TSS karşılar ✅</div>
                </div>
              </div>

              {/* Plan Features */}
              {extra?.planFeatures && (
                <div className="bg-white rounded-2xl border-2 border-[#0D297B] p-5 mb-5 shadow-md">
                  <h3 className="font-bold text-lg text-[#201652] mb-3">🏆 Profilinize Özel Plan</h3>
                  <ul className="space-y-2 mb-4">
                    {extra.planFeatures.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 bg-[#D6DEFF] rounded-full flex items-center justify-center text-[10px] text-[#0D297B] font-bold shrink-0 mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {extra.urgencyText && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">{extra.urgencyText}</div>
                  )}
                </div>
              )}

              {/* Insurance Firms */}
              <h3 className="font-bold text-base text-[#201652] flex items-center gap-2 mb-3">🏢 Teklif Alacağınız Sigorta Firmaları</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
                {firms.map((f) => {
                  const colors = FIRM_COLORS[f.name] || { bg: "#E3F2FD", fg: "#0D297B" };
                  return (
                    <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-2.5 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all" style={{ borderTopWidth: 3, borderTopColor: colors.fg }}>
                      <div className="w-9 h-9 mx-auto mb-1 rounded-[10px] flex items-center justify-center text-[13px] font-extrabold" style={{ background: colors.bg, color: colors.fg }}>
                        {f.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-[10px] font-bold text-gray-800 leading-tight">{f.name.replace(" Sigorta", "")}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center text-xs text-gray-500 mb-5 font-medium">✅ {firms.length} sigorta firmasından anlık fiyat karşılaştırması</div>

              {/* Consultant image + WhatsApp CTA */}
              <img
                src="https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=680&q=80&auto=format&fit=crop"
                alt="Sigorta danışmanı"
                className="w-full h-[150px] object-cover object-[center_20%] rounded-2xl shadow-md mt-6"
              />
              {extra?.waSection && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-6 mt-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{extra.waSection.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{extra.waSection.desc}</p>
                  {extra.waSection.benefits && (
                    <ul className="space-y-1.5 mb-5">
                      {extra.waSection.benefits.map((b: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-green-600 font-bold">✓</span>{b}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={openWhatsApp}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-4 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all text-sm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    {extra.waSection.buttonText}
                  </button>
                </div>
              )}

              {/* FAQ */}
              {extra?.faq && (
                <>
                  <h3 className="font-bold text-base text-[#201652] flex items-center gap-2 mt-6 mb-3">❓ Sık Sorulan Sorular</h3>
                  <FaqSection items={extra.faq} />
                </>
              )}
            </div>
          )}

          {/* ─── SUCCESS ─── */}
          {currentScreen === "sSuccess" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-5 bg-[#D6DEFF] border-3 border-[#1A3A9C] rounded-full flex items-center justify-center text-4xl">✅</div>
              {extra?.badge && <p className="text-[10px] text-gray-400 font-bold tracking-wider mb-2">{extra.badge}</p>}
              <h2 className="text-2xl font-bold text-[#0D297B] mb-3">{screen.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{screen.subtitle}</p>
              {extra?.nextSteps && (
                <div className="bg-[#EEF1FB] border border-[#D6DEFF] rounded-xl p-4 text-left text-sm text-gray-700 leading-loose">
                  <strong className="text-[#0D297B] block mb-2">Sonraki adımlar:</strong>
                  {extra.nextSteps.map((s: string, i: number) => (
                    <div key={i}>{s}</div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-bold text-[#201652]"
          >
            {item.q}
            <span className={`w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[#0D297B] text-sm transition-transform ${open === i ? "rotate-45 bg-[#0D297B] text-white" : ""}`}>+</span>
          </button>
          {open === i && (
            <div className="px-4 pb-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-2">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
