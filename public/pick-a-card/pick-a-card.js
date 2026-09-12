/* STARVIA · Pick a Card — ใช้ข้อมูลไพ่ 78 ใบจริง + API quota/streak จริง */
const $ = (id) => document.getElementById(id);

const API = "/v1/pick";

const state = {
  // สมาชิก = มี JWT premium (จาก PIN หรือ FB subscription) เก็บใน localStorage
  member:
    localStorage.getItem("starvia_premium") === "true" ||
    !!localStorage.getItem("starvia_premium_token"),
  quotaLeft: 1,
  streak: 0,
  topic: null,
  history: [],
  trial: false, // โหมดลองฟรีจากหน้าจ่ายเงิน — ไม่ยิง API ไม่หักโควตา
};

const TOPIC_LABEL = { career: "การงาน", money: "การเงิน", love: "ความรัก", health: "สุขภาพ" };
const TOPIC_ICON = { career: "💼", money: "💰", love: "💕", health: "🌿" };
const CARD_IMG = (slug) => `cards/${slug}.png`;

/* ── Screen switcher ─────────────────────── */
const SCREENS = ["scrTopic", "scrFan", "scrReveal", "scrHistory", "scrGate"];
function show(id) {
  SCREENS.forEach((s) => $(s).classList.toggle("on", s === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ── ประโยคประจำวัน (affirmation) — เลือกตามระดับ pos ของไพ่ ──
   ใบเดิมได้ประโยคเดิมเสมอ (hash จาก slug) — รู้สึกว่าเป็นของตัวเอง */
const AFFIRM = {
  high: [
    "วันนี้จักรวาลเข้าข้างคุณ เดินหน้าได้เลย",
    "แสงของคุณชัดแล้ว ทำสิ่งนั้นเถอะ",
    "จังหวะดีมาถึงแล้ว อย่าปล่อยให้หลุดมือ",
    "คุณพร้อมกว่าที่คิด ลุยได้เลยวันนี้",
  ],
  mid: [
    "ค่อยๆ ก้าวก็ถึง ใจนิ่งๆ ไว้นะ",
    "วันนี้ทำดีได้ดี ระวังแค่เรื่องเสี่ยง",
    "พักบ้างก็ได้ แล้วค่อยเริ่มใหม่",
    "ฟังเสียงหัวใจตัวเองก่อนตัดสินใจ",
  ],
  low: [
    "วันที่หนักจะผ่านไป คุณไม่ได้อยู่คนเดียว",
    "ช้าลงนิด ใช้สติ ทุกอย่างจะคลี่คลาย",
    "คืนนี้พักให้พอ พรุ่งนี้เริ่มใหม่ได้",
    "เมฆบังแค่ชั่วคราว แสงยังรอคุณอยู่",
  ],
};
function pickAffirm(card) {
  const mood = card.pos >= 75 ? "high" : card.pos >= 45 ? "mid" : "low";
  const pool = AFFIRM[mood];
  let h = 0;
  const s = String(card.slug || card.name || "");
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

/* ── Breath ritual: แตะไพ่ → นับ 3-2-1 → ค่อยพลิกเฉลย ── */
let breathSeq = 0;
let breathCard = null;
function revealWithBreath(card) {
  fillReveal(card);
  // รีเซ็ต meter ไว้ก่อน — จะวิ่งตอนพลิกไพ่จริง (หลัง overlay หาย)
  $("rvPosFill").style.width = "0%";
  breathCard = card;
  breathSeq += 1;
  $("breathNum").textContent = "แตะไพ่";
  $("breathTap").disabled = false;
  $("breathOv").hidden = false;
  // โหมดลองฟรี: โชว์ปุ่มชวนสมัคร + เปลี่ยนโน้ตท้าย
  $("btnTrialSub").hidden = !state.trial;
  $("rvNote").textContent = state.trial
    ? "นี่คือใบลองชวน — สมัครแล้วมีไพ่รอทุกเช้า 💜"
    : "กลับมาหยิบใหม่ได้พรุ่งนี้นะคะ 💜";
  show("scrReveal");
}
function breathStart() {
  const seq = breathSeq;
  const tap = $("breathTap");
  tap.disabled = true;
  let n = 3;
  $("breathNum").textContent = n;
  const tick = () => {
    if (seq !== breathSeq) return; // ผู้ใช้กดย้อนกลับระหว่างนับ — ยกเลิก
    n -= 1;
    if (n <= 0) {
      $("breathOv").hidden = true;
      requestAnimationFrame(() =>
        setTimeout(() => {
          if (seq !== breathSeq) return;
          $("rvFlip").classList.add("flip");
          renderMeter(breathCard.pos);
        }, 250)
      );
      return;
    }
    $("breathNum").textContent = n;
    setTimeout(tick, 900);
  };
  setTimeout(tick, 900);
}
async function shareAffirm() {
  const text = `🔮 ประโยคประจำวันจาก STARVIA\n“${$("rvAffirm").textContent}”\n— ${$("rvName").textContent}`;
  const btn = $("btnShareAffirm");
  try {
    if (navigator.share) {
      await navigator.share({ title: "STARVIA · ประโยคประจำวัน", text });
      return;
    }
    await navigator.clipboard.writeText(text);
  } catch (e) {
    return; // ผู้ใช้กดยกเลิก — ไม่ต้องทำอะไร
  }
  btn.textContent = "✓ คัดลอกแล้ว";
  setTimeout(() => { btn.textContent = "📤 แชร์ประโยคนี้"; }, 2000);
}

/* ── Boot ───────────────────────────────── */
/* ── API helper: ส่ง Authorization header (JWT premium) ทุก call ── */
function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = localStorage.getItem("starvia_premium_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(path, { ...options, headers });
}

async function loadState() {
  try {
    const r = await apiFetch(`${API}/state`);
    const d = await r.json();
    if (d.success) {
      state.quotaLeft = d.quotaLeft;
      state.streak = d.streak;
      state.history = d.history || [];
    } else if (d.error === "TOKEN_EXPIRED" || d.error === "INVALID_TOKEN") {
      // Token หมดอายุ → ล้าง session ให้กลับไปหน้า gate
      localStorage.removeItem("starvia_premium");
      localStorage.removeItem("starvia_premium_token");
      state.member = false;
    }
  } catch (e) {
    console.warn("pick state API ไม่พร้อม — ใช้โหมด offline", e);
  }
  renderMeta();
  renderHistory();
  show(state.member ? "scrTopic" : "scrGate");
}

function boot() {
  const th = new Date().toLocaleDateString("th-TH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  $("todayText").textContent = th;
  loadState();
}

function renderMeta() {
  $("streakVal").textContent = `${state.streak} วัน`;
  $("quotaVal").textContent = state.quotaLeft > 0 ? `${state.quotaLeft} ครั้ง` : "หมดแล้ว";
  $("historyCount").textContent = state.history.length;
}

/* ── เลือกไพ่ตามหัวข้อ ──────────────────── */
function getCardsForTopic(topic) {
  const all = window.CARD_DATA || [];
  // สุ่ม 7 ใบจากไพ่ทั้งหมดที่เข้ากับหัวข้อ (หรือทุกใบถ้าไม่มี filter)
  const filtered = all.filter(c => c.topic === topic || Math.random() > 0.6);
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 7);
}

/* ── ลองฟรี 1 ใบจากหน้าจ่ายเงิน — ไม่ยิง API ไม่หักโควตา ไม่นับ streak ── */
function trialPick() {
  const all = window.CARD_DATA || [];
  if (!all.length) return;
  state.topic = "career";
  state.trial = true;
  revealWithBreath(all[Math.floor(Math.random() * all.length)]);
}

/* ── Quick Mode: 1 ปุ่ม → สุ่มไพ่ 1 ใบจาก 78 → เฉลยทันที (t-020) ── */
function quickPick() {
  if (state.quotaLeft <= 0) {
    showQuotaModal();
    return;
  }
  state.trial = false;
  const all = window.CARD_DATA || [];
  if (!all.length) return;
  const card = all[Math.floor(Math.random() * all.length)];
  state.topic = "career"; // topic กลางๆ สำหรับบันทึก — Quick Mode ไม่ถามหัวข้อ
  state.fanCards = [card];
  pickSingleCard(card);
}

/* เฉลยไพ่เดียวจาก Quick Mode — บันทึกผ่าน API แบบเดียวกับ pickCard */
async function pickSingleCard(card) {
  try {
    const r = await apiFetch(`${API}/draw`, {
      method: "POST",
      body: JSON.stringify({
        topic: state.topic,
        slug: card.slug,
        name: card.name,
        emoji: card.emoji,
        reading: card.reading || "",
        pos: card.pos != null ? Number(card.pos) : null,
        sub: card.sub || "",
        num: card.num || "",
        color: card.color || "",
        do: card.do || "",
        dont: card.dont || "",
      }),
    });
    const d = await r.json();
    if (!d.success) {
      showQuotaModal();
      return;
    }
    state.quotaLeft = d.quotaLeft;
    state.streak = d.streak;
    state.history = d.history || state.history;
    renderMeta();
  } catch (e) {
    console.warn("draw API ไม่พร้อม — เปิดแบบ offline (ไม่บันทึก)", e);
    state.quotaLeft -= 1;
    state.streak += 1;
    state.history.unshift({
      date: new Date().toISOString(), card: card.name, emoji: card.emoji,
      topic: TOPIC_LABEL[state.topic], slug: card.slug,
      reading: card.reading || "", pos: card.pos != null ? Number(card.pos) : null,
      sub: card.sub || "", num: card.num || "", color: card.color || "",
      do: card.do || "", dont: card.dont || "",
    });
    renderMeta();
  }
  // เฉลยแบบมี breath ritual (แตะไพ่ → นับ 3-2-1 → พลิก)
  revealWithBreath(card);
}

/* ── Topic → Fan ────────────────────────── */
$("topicGrid").addEventListener("click", (e) => {
  const btn = e.target.closest(".tp");
  if (!btn) return;
  state.topic = btn.dataset.topic;
  $("fanTopicTitle").textContent = `${TOPIC_ICON[state.topic]} ${TOPIC_LABEL[state.topic]}`;
  buildFan();
  show("scrFan");
});

function buildFan() {
  const row = $("fanRow");
  row.innerHTML = "";
  const cards = getCardsForTopic(state.topic);
  state.fanCards = cards; // เก็บไว้ใช้ตอน pick
  const N = cards.length;
  const spread = 26;
  const gap = window.innerWidth <= 420 ? 28 : 40; // จอเล็กชิดขึ้น ไพ่ใหญ่ไม่ล้นขอบ
  for (let i = 0; i < N; i++) {
    const t = i - (N - 1) / 2;
    const card = cards[i];
    const c = document.createElement("button");
    c.className = "card-f";
    c.setAttribute("role", "option");
    c.setAttribute("aria-label", `เลือกไพ่ใบที่ ${i + 1}`); // ไม่เฉลยชื่อไพ่ก่อนเลือก
    c.style.setProperty("--rot", `${(t * spread) / (N / 2)}deg`);
    c.style.setProperty("--x", `${t * gap}px`);
    c.style.setProperty("--y", `${Math.abs(t) * 7}px`);
    c.style.transitionDelay = `${i * 40}ms`;

    // โครงสร้างพลิก: หลังไพ่ (เห็นก่อน) + หน้าไพ่ (ซ่อน พลิกเฉลยตอนเลือก)
    const inner = document.createElement("div");
    inner.className = "card-inner";

    const back = document.createElement("div");
    back.className = "card-back";
    const backImg = document.createElement("img");
    backImg.src = CARD_IMG("_back");
    backImg.alt = "";
    back.appendChild(backImg);

    const front = document.createElement("div");
    front.className = "card-front";
    const frontImg = document.createElement("img");
    frontImg.src = CARD_IMG(card.slug);
    frontImg.alt = card.name;
    front.appendChild(frontImg);

    inner.appendChild(back);
    inner.appendChild(front);
    c.appendChild(inner);

    c.addEventListener("click", () => pickCard(c, i));
    row.appendChild(c);
  }
}

/* ── Pick → Reveal ──────────────────────── */
async function pickCard(el, idx) {
  if (state.quotaLeft <= 0) {
    showQuotaModal();
    return;
  }
  const card = state.fanCards[idx];
  state.trial = false;

  // บันทึกการเปิดไพ่ผ่าน API (หัก quota จริง) — fallback offline ถ้า API ไม่พร้อม
  try {
    const r = await apiFetch(`${API}/draw`, {
      method: "POST",
      body: JSON.stringify({
        topic: state.topic,
        slug: card.slug,
        name: card.name,
        emoji: card.emoji,
        reading: card.reading || "",
        pos: card.pos != null ? Number(card.pos) : null,
        sub: card.sub || "",
        num: card.num || "",
        color: card.color || "",
        do: card.do || "",
        dont: card.dont || "",
      }),
    });
    const d = await r.json();
    if (!d.success) {
      showQuotaModal();
      return;
    }
    state.quotaLeft = d.quotaLeft;
    state.streak = d.streak;
    state.history = d.history || state.history;
  } catch (e) {
    console.warn("draw API ไม่พร้อม — เปิดแบบ offline (ไม่บันทึก)", e);
    state.quotaLeft -= 1;
    state.streak += 1;
    state.history.unshift({
      date: new Date().toISOString(), card: card.name, emoji: card.emoji,
      topic: TOPIC_LABEL[state.topic], slug: card.slug,
      reading: card.reading || "", pos: card.pos != null ? Number(card.pos) : null,
      sub: card.sub || "", num: card.num || "", color: card.color || "",
      do: card.do || "", dont: card.dont || "",
    });
  }

  el.classList.add("sel");
  document.querySelectorAll(".card-f").forEach((c) => {
    if (c !== el) c.style.pointerEvents = "none";
  });

  setTimeout(() => {
    revealWithBreath(card);
  }, 900); // รอ fan flip (750ms) จบก่อนเข้าหน้าเฉลยแบบ breath
}

function fillReveal(card) {
  $("rvFlip").classList.remove("flip");

  // ใส่ภาพไพ่ในหน้า reveal
  const frontFace = $("rvCardFace");
  frontFace.innerHTML = "";
  const img = document.createElement("img");
  img.src = CARD_IMG(card.slug);
  img.alt = card.name;
  img.className = "rv-card-img";
  frontFace.appendChild(img);

  $("rvName").textContent = card.name;
  $("rvSub").textContent = card.sub;
  $("rvTopicLabel").textContent = TOPIC_LABEL[state.topic];
  $("rvReading").textContent = card.reading;
  $("rvNum").textContent = card.num;
  $("rvColor").textContent = card.color;
  $("rvDo").textContent = card.do;
  $("rvDont").textContent = card.dont;
  $("rvAffirm").textContent = pickAffirm(card);
  renderMeter(card.pos);
}

/* ── ระดับความมงคล (meter) ──────────────── */
function renderMeter(pos) {
  const fill = $("rvPosFill");
  const pct = $("rvPosPct");
  const tag = $("rvPosTag");
  fill.classList.remove("mid", "low");
  tag.classList.remove("high", "mid", "low");
  fill.style.width = "0%";

  let label = "";
  let cls = "high";
  if (pos >= 75) {
    label = "✨ ดวงดีมาก — วันที่จักรวาลหนุน";
  } else if (pos >= 45) {
    label = "🌤️ ดวงกลางๆ — ทำดีได้ดี ทำเสี่ยงก็ต้องระวัง";
    cls = "mid";
    fill.classList.add("mid");
  } else {
    label = "🌧️ ต้องระวัง — ค่อยๆ ใช้ชีวิตแบบมีสติ";
    cls = "low";
    fill.classList.add("low");
  }

  pct.textContent = `${pos}%`;
  tag.textContent = label;
  tag.classList.add(cls);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.width = `${pos}%`;
  }));
}

/* ── History ────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "วันนี้";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function renderHistory() {
  const list = $("hsList");
  list.innerHTML = "";
  if (!state.history.length) {
    list.innerHTML = '<div class="hs-empty">ยังไม่มีประวัติ — เริ่มหยิบใบแรกกันเถอะ ✨</div>';
    $("hsStreakN").textContent = "0 วันติดต่อกัน";
    return;
  }
  state.history.forEach((h) => {
    const it = document.createElement("div");
    it.className = "hs-item";
    it.setAttribute("role", "button");
    it.setAttribute("tabindex", "0");
    const name = h.name || h.card || "ไพ่ปริศนา";
    const slug = h.slug || name.toLowerCase().replace(/ /g, "_").replace("of_", "").replace("__", "_");
    const topicLabel = TOPIC_LABEL[h.topic] || h.topic || "ทั่วไป";
    it.innerHTML = `
      <img src="${CARD_IMG(slug)}" class="hs-card-img" alt="${name}">
      <div class="hs-info">
        <div class="hs-card-n">${name}</div>
        <div class="hs-meta">${fmtDate(h.date)}</div>
      </div>
      <div class="hs-topic">${topicLabel}</div>
      <div class="hs-arrow">›</div>`;
    it.addEventListener("click", () => viewHistoryCard(h));
    it.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); viewHistoryCard(h); }
    });
    list.appendChild(it);
  });
  $("hsStreakN").textContent = `${state.streak} วันติดต่อกัน`;
}

/* ── ดูรายละเอียดไพ่จากประวัติ (เหมือนเปิดไพ่รอบแรก) ── */
function viewHistoryCard(h) {
  const topicKeys = ["career", "money", "love", "health"];
  state.topic = topicKeys.includes(h.topic) ? h.topic
    : Object.keys(TOPIC_LABEL).find((k) => TOPIC_LABEL[k] === h.topic) || "career";
  const card = {
    slug: h.slug,
    name: h.name || h.card || "ไพ่ปริศนา",
    sub: h.sub || "",
    emoji: h.emoji || "🃏",
    reading: h.reading || "ใบนี้คือใบที่เคยหยิบไว้ — ฟังเสียงหัวใจตัวเองนะคะ ✨",
    num: h.num || "",
    color: h.color || "",
    do: h.do || "",
    dont: h.dont || "",
    pos: h.pos != null ? Number(h.pos) : 65,
  };
  fillReveal(card);
  show("scrReveal");
  setTimeout(() => $("rvFlip").classList.add("flip"), 300);
}

/* ── Quota modal ────────────────────────── */
function showQuotaModal() {
  $("quotaModal").hidden = false;
}
$("btnModalClose").addEventListener("click", () => {
  $("quotaModal").hidden = true;
  show("scrTopic");
});
$("btnModalHistory").addEventListener("click", () => {
  $("quotaModal").hidden = true;
  renderHistory();
  show("scrHistory");
});

/* ── Nav wiring ─────────────────────────── */
$("btnBackTopic").addEventListener("click", () => show("scrTopic"));
$("btnHistory").addEventListener("click", () => { renderHistory(); show("scrHistory"); });
$("btnBackHome").addEventListener("click", () => show("scrTopic"));
$("btnRvHome").addEventListener("click", () => show(state.member ? "scrTopic" : "scrGate"));
$("btnTrialPick").addEventListener("click", trialPick);
$("btnTrialSub").addEventListener("click", () => { state.trial = false; show("scrGate"); });
$("btnQuickPick").addEventListener("click", quickPick);
$("breathTap").addEventListener("click", breathStart);
$("btnShareAffirm").addEventListener("click", shareAffirm);

/* จ่ายเรียบร้อย → แจ้งให้ส่งสลิปทาง Messenger (Omise ไม่ผ่านอนุมัติ — flow manual) */
$("btnPaid").addEventListener("click", () => {
  showMsg(
    "💜",
    "รับทราบการโอนแล้วค่ะ",
    "ส่งสลิปทาง <b>Messenger</b> (ปุ่มสีฟ้าด้านบน) แม่หมอจะตอบกลับพร้อม PIN<br>แล้วกลับมากรอก PIN ด้านล่างเพื่อเปิดสมาชิกได้เลยค่ะ"
  );
});
/* ── Modal ข้อความกลางจอ (แจ้งผล login/เตือน) ── */
function showMsg(icon, title, body) {
  $("msgIc").textContent = icon;
  $("msgTitle").textContent = title;
  $("msgBody").innerHTML = body;
  $("msgModal").hidden = false;
}
$("btnMsgOk").addEventListener("click", () => { $("msgModal").hidden = true; });

/* ── FB Login — สมาชิก subscription เข้าสู่ระบบ ── */
const FB_APP_ID = "961734170201333";
/* FIX 2 ส.ค.69: ใช้ config_id (Facebook Login for Business) แทน scope เดิม
   ที่ขอแค่ public_profile,email — Facebook บล็อกเพราะต้องมี supported
   permission อย่างน้อย 1 ตัว ("This app needs at least one supported
   permission") — config นี้สร้างใน App Dashboard → Facebook Login for
   Business → Configuration (id 2107475713169524) */
const FB_LOGIN_CONFIG_ID = "2107475713169524";
let fbSdkPromise = null;

function loadFbSdk() {
  if (window.FB) return Promise.resolve(true);
  if (fbSdkPromise) return fbSdkPromise;
  fbSdkPromise = new Promise((resolve) => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FB_APP_ID, version: "v22.0", cookie: true });
      resolve(true);
    };
    const s = document.createElement("script");
    s.src = "https://connect.facebook.net/en_US/sdk.js";
    s.defer = true;
    document.head.appendChild(s);
  });
  return fbSdkPromise;
}

async function checkSubscriber(accessToken, userID) {
  const btn = $("btnFbLogin");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ กำลังตรวจสถานะสมาชิก…"; }
  try {
    const r = await fetch("/v1/facebook/subscriber-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, userID }),
    });
    const d = await r.json();
    if (d.success && d.isSubscriber && d.token) {
      localStorage.setItem("starvia_premium_token", d.token);
      localStorage.setItem("starvia_premium", "true");
      localStorage.setItem("starvia_fb_user", String(userID || ""));
      location.reload();
    } else if (d.success && !d.isSubscriber) {
      showMsg("💜", "ยังไม่ได้เป็นสมาชิกค่ะ", "กดปุ่ม <b>\"สมัครสมาชิกผ่าน Facebook\"</b> ข้างบนก่อน แล้วกลับมาเข้าด้วย Facebook อีกครั้งนะคะ");
    } else {
      console.warn("subscriber-check:", d);
      showMsg("🔧", "ระบบตรวจสมาชิกยังไม่พร้อม", "Facebook ยังไม่เปิดช่องทางนี้ให้ (แม่หมอกำลังจัดการอยู่) — สมัครสมาชิกผ่าน Facebook แล้วใช้ PIN จากแชทกรอกได้เลยค่ะ");
    }
  } catch (e) {
    console.warn("subscriber-check error:", e);
    showMsg("😔", "ติดต่อระบบไม่ได้", "ลองใหม่อีกครั้งนะคะ ถ้ายังไม่ได้ แจ้งแม่หมอได้เลยค่ะ");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "🔑 เป็นสมาชิกแล้ว? เข้าด้วย Facebook"; }
  }
}

/* (t-021) FB login flow เดิมตัดออกพร้อมปุ่ม — ไม่มี event ผูกกับ btnFbLogin อีกต่อไป */

/* (t-021) ปุ่มสมัคร FB + FB login เดิมตัดออก — หน้าจ่ายเป็น QR ในเว็บ + PIN แทน
   เก็บ loadFbSdk/checkSubscriber ไว้เผื่อระบบ subscriber กลับมา (ไม่มีปุ่มเรียกแล้ว) */

/* ── PIN Verify ── */
$("btnPin").addEventListener("click", verifyPin);
$("pinInput").addEventListener("keydown", (e) => { if (e.key === "Enter") verifyPin(); });

async function verifyPin() {
  const pin = ($("pinInput").value || "").trim().toUpperCase();
  if (!pin) return;
  const msg = $("pinMsg");
  msg.hidden = false;
  msg.style.color = "#aaa";
  msg.textContent = "⏳ กำลังตรวจสอบ PIN…";
  try {
    const r = await fetch("/v1/premium/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const d = await r.json();
    if (d.success && d.token) {
      msg.style.color = "#0f0";
      msg.textContent = "✅ เข้าสำเร็จ กำลังโหลด…";
      localStorage.setItem("starvia_premium_token", d.token);
      localStorage.setItem("starvia_premium", "true");
      setTimeout(() => location.reload(), 600);
    } else {
      msg.style.color = "#f0c";
      msg.textContent = "❌ " + (d.message || d.error || "PIN ไม่ถูกต้อง");
    }
  } catch (e) {
    msg.style.color = "#f0c";
    msg.textContent = "❌ ติดต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง";
  }
}

boot();
