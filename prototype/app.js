/* =============================================================
   MyABZ prototype — application
   -------------------------------------------------------------
   Vanilla JS, no build step. Routes mirror the production MyABZ
   route names so the backend mapping stays 1:1:

     auth · dashboard · accounts · transactions · transfer ·
     transfer/to-own-account · transfer/to-someones-account ·
     transfer/by-mobile-or-pn · transfer/utility · transfer/airtime ·
     transfer/pending · transfer/approve · templates · take-a-loan ·
     calendar · statements · fx · locator · support · settings

   New routes are marked NEW in the nav definition below.
   ============================================================= */

/* ---------------------------------------------------------------
   1. STATE
   --------------------------------------------------------------- */
const S = {
  route: "auth",
  param: null,
  signedIn: false,
  firstLogin: false,        // set when signing in with the issued-credentials demo
  profileId: "PR-1",
  accountId: "AC-1",
  txSearch: "",
  txFilter: "all",
  locFilter: "all",
  showBalances: true,
  flow: null,
};

const CUR = { ZMW: "K", USD: "$", EUR: "€", GBP: "£", ZAR: "R" };

/* ---------------------------------------------------------------
   2. HELPERS
   --------------------------------------------------------------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function money(n, currency) {
  const v = Math.abs(Number(n) || 0);
  return v.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function cur(c) { return CUR[c] || c; }
function amt(n, c) { return cur(c) + money(n, c); }

function maskAcc(n) {
  if (!n) return "";
  return "•••• " + String(n).slice(-4);
}

function dateLabel(iso) {
  const d = new Date(iso);
  const today = new Date("2026-09-06T12:00:00");
  const days = Math.floor((today - d) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function shortDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function accounts() { return ACCOUNTS.filter(a => a.profileId === S.profileId); }
function account(id) { return ACCOUNTS.find(a => a.id === id) || accounts()[0]; }
function profile() { return CUSTOMER.profiles.find(p => p.id === S.profileId); }
function isBusiness() { return profile().type === "business"; }
function pendingCount() { return isBusiness() ? APPROVALS.length : 0; }
function unreadCount() { return NOTIFICATIONS.filter(n => n.unread).length; }

function bankByCode(code) { return BANKS.find(b => b.code === code); }
function mnoFor(phone) {
  const p = String(phone || "").replace(/\D/g, "").replace(/^260/, "0");
  const pre = p.slice(0, 3);
  return MNOS.find(m => m.prefixes.includes(pre)) || null;
}
function lookupName(accNo) { return NAME_LOOKUP[String(accNo || "").trim()] || null; }

function txFor(accountId) {
  return TRANSACTIONS.filter(t => t.accountId === accountId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
function txForProfile() {
  const ids = accounts().map(a => a.id);
  return TRANSACTIONS.filter(t => ids.includes(t.accountId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function go(route, param) {
  S.route = route; S.param = param || null;
  window.scrollTo(0, 0);
  render();
}

function toast(msg, iconName) {
  const host = $("#toast-root");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = (iconName ? icon(iconName, 17) : "") + "<span>" + esc(msg) + "</span>";
  host.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function modal(html) { $("#modal-root").innerHTML = html; }
function closeModal() { $("#modal-root").innerHTML = ""; }

/* ---------------------------------------------------------------
   3. NAVIGATION MODEL
   --------------------------------------------------------------- */
const NAV = [
  { group: null, items: [
    { id: "dashboard",    label: "Dashboard",   icon: "home" },
    { id: "accounts",     label: "Accounts",    icon: "accounts" },
    { id: "transactions", label: "Transactions", icon: "history" },
  ]},
  { group: "Move money", items: [
    { id: "transfer",   label: "Transfer",       icon: "transfer" },
    { id: "airtime",    label: "Airtime & data", icon: "airtime", isNew: true },
    { id: "utility",    label: "Pay a bill",     icon: "bill" },
    { id: "fx",         label: "Foreign exchange", icon: "fx", isNew: true },
    { id: "approvals",  label: "Approvals",      icon: "approvals", business: true },
  ]},
  { group: "Manage", items: [
    { id: "templates",  label: "Templates",         icon: "templates" },
    { id: "calendar",   label: "Scheduled payments", icon: "scheduled" },
    { id: "loans",      label: "Loans",             icon: "loans" },
    { id: "statements", label: "Statements",        icon: "statements" },
  ]},
  { group: "Help", items: [
    { id: "products", label: "Products & services", icon: "grid", isNew: true },
    { id: "locator",  label: "Branches & agents", icon: "locator", isNew: true },
    { id: "support",  label: "Support",           icon: "support", isNew: true },
    { id: "settings", label: "Settings",          icon: "settings" },
  ]},
];

const BOTNAV = [
  { id: "dashboard",    label: "Home",     icon: "home" },
  { id: "accounts",     label: "Accounts", icon: "accounts" },
  { id: "transfer",     label: "Transfer", icon: "transfer" },
  { id: "transactions", label: "Activity", icon: "history" },
  { id: "more",         label: "More",     icon: "grid" },
];

/* ---------------------------------------------------------------
   4. AUTH SCREENS
   --------------------------------------------------------------- */
function viewAuth() {
  return `
  <div class="auth-wrap">
    <div class="auth-brand">
      <div class="logo"><img class="lg" src="assets/logo-white.png" alt="AB Bank"></div>
      <div>
        <h2>Banking without the barriers.</h2>
        <p>Move money, pay bills and manage your business accounts &mdash; anytime, anywhere, on any device.</p>
      </div>
      <div class="values"><span>Simple</span><span>Responsive</span><span>Reliable</span></div>
    </div>

    <div class="auth-panel">
      <div class="auth-card">
        <div class="auth-mobile-logo">
          <div class="logo"><img src="assets/logo.png" alt="AB Bank"></div>
        </div>
        <h1>Sign in to MyABZ</h1>
        <p class="sub">Use the username and password issued by the bank.</p>

        <div class="field">
          <label for="u">Username</label>
          <input class="input" id="u" value="cmwale" autocomplete="username">
        </div>
        <div class="field">
          <label for="pw">Password</label>
          <div class="input-wrap">
            <input class="input" id="pw" type="password" value="AbZ2026!" autocomplete="current-password" style="padding-right:44px">
            <div class="trail">
              <button class="icon-btn" style="width:30px;height:30px" onclick="togglePw()" aria-label="Show password">${icon("eye", 18)}</button>
            </div>
          </div>
        </div>

        <div class="row" style="justify-content:space-between;margin-bottom:20px">
          <label class="row small" style="gap:7px;cursor:pointer">
            <input type="checkbox" id="remember"> Remember this device
          </label>
          <a href="#" onclick="event.preventDefault();go('reset-password')">Forgot password?</a>
        </div>

        <button class="btn btn-primary btn-lg btn-block" onclick="signIn(false)">Sign in</button>

        <div class="row" style="gap:12px;margin:16px 0">
          <div class="hr" style="flex:1;margin:0"></div><span class="tiny faint">OR</span><div class="hr" style="flex:1;margin:0"></div>
        </div>
        <button class="btn btn-secondary btn-block" onclick="toast('Biometric sign-in would open the device prompt','fingerprint')">
          ${icon("fingerprint", 19)} Sign in with fingerprint
        </button>

        <div class="banner banner-info mt24" style="font-size:13px">
          <span class="b-ico">${icon("info", 17)}</span>
          <div class="b-body">
            <b>First time signing in?</b>
            <p>If the contact centre has just registered you,
            <a href="#" onclick="event.preventDefault();signIn(true)">activate your account</a>.</p>
          </div>
        </div>

        <div class="auth-foot">
          AB Bank Zambia Limited is regulated by the Bank of Zambia and is a member of the Deposit Insurance Scheme.<br>
          <a href="#" onclick="event.preventDefault();go('terms-of-use')">Terms of use</a>
          &middot; Need help? Call <b>888</b>
        </div>
      </div>
    </div>
  </div>`;
}

function togglePw() {
  const el = $("#pw");
  el.type = el.type === "password" ? "text" : "password";
}

function signIn(first) {
  S.signedIn = true;
  S.firstLogin = !!first;
  go(first ? "activate" : "dashboard");
}

/* --- first login: forced credential change (registration is assisted) --- */
function viewActivate() {
  return `
  <div class="auth-wrap">
    <div class="auth-brand">
      <div class="logo"><img class="lg" src="assets/logo-white.png" alt="AB Bank"></div>
      <div>
        <h2>Let&rsquo;s secure your account.</h2>
        <p>Your account was registered by our team. Choose a password only you know, and we&rsquo;ll get you started.</p>
      </div>
      <div class="values"><span>Simple</span><span>Responsive</span><span>Reliable</span></div>
    </div>
    <div class="auth-panel">
      <div class="auth-card">
        <div class="stepper">
          <span class="st on"><span class="n">1</span> Password</span><span class="bar"></span>
          <span class="st"><span class="n">2</span> Verify</span><span class="bar"></span>
          <span class="st"><span class="n">3</span> Done</span>
        </div>
        <h1>Create your password</h1>
        <p class="sub">Welcome, ${esc(CUSTOMER.firstName)}. Replace the temporary password you were given.</p>

        <div class="field">
          <label for="np">New password</label>
          <input class="input" id="np" type="password" placeholder="At least 8 characters">
          <div class="hint">Use 8 or more characters with a mix of letters, numbers and symbols.</div>
        </div>
        <div class="field">
          <label for="np2">Confirm new password</label>
          <input class="input" id="np2" type="password" placeholder="Type it again">
        </div>

        <div class="banner banner-warn mb16" style="font-size:13px">
          <span class="b-ico">${icon("shield", 17)}</span>
          <div class="b-body">
            <b>Never share this password</b>
            <p>AB Bank will never ask for your password, PIN or OTP &mdash; not by phone, SMS or email.</p>
          </div>
        </div>

        <button class="btn btn-primary btn-lg btn-block" onclick="activateStep2()">Continue</button>
        <div class="auth-foot">Need help? Call <b>888</b></div>
      </div>
    </div>
  </div>`;
}

function activateStep2() {
  modal(otpModal({
    title: "Verify it's you",
    body: "We sent a 6-digit code to " + maskPhone(CUSTOMER.phone) + ".",
    onDone: "activateDone()",
  }));
}
function maskPhone(p) { return String(p).slice(0, 4) + " ••• " + String(p).slice(-3); }

function activateDone() {
  closeModal();
  S.firstLogin = false;
  S.newUser = true;
  go("dashboard");
  setTimeout(() => toast("Your account is ready", "check"), 250);
}

/* ---------------------------------------------------------------
   5. SHELL
   --------------------------------------------------------------- */
function shell(inner) {
  const p = profile();
  return `
  <div class="app on">
    <aside class="sidebar">
      <div class="sidebar-head">
        <div class="logo"><img src="assets/logo-white.png" alt="AB Bank"></div>
      </div>
      <nav class="sidebar-nav">${navItems()}</nav>
      <div class="sidebar-foot">
        <div class="row" style="gap:8px">
          ${icon("lock", 14)}<span>Secure session &middot; 14:52</span>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="mobile-logo"><div class="logo"><img src="assets/logo.png" alt="AB Bank"></div></div>
        <button class="profile-switch" onclick="openProfileSwitch()">
          <span class="avatar sm ${p.type === "business" ? "navy" : ""}">${p.type === "business" ? icon("building", 14) : esc(CUSTOMER.initials)}</span>
          <span style="min-width:0">
            <span class="pf-name">${esc(p.label)}</span>
            <span class="pf-tier">${esc(p.tier)}</span>
          </span>
          ${icon("chevronDown", 15)}
        </button>
        <div class="topbar-right">
          <button class="icon-btn" onclick="go('notifications')" aria-label="Notifications">
            ${icon("bell", 20)}${unreadCount() ? '<span class="dot"></span>' : ""}
          </button>
          <button class="icon-btn" onclick="openAccountMenu()" aria-label="Your profile">
            <span class="avatar">${esc(CUSTOMER.initials)}</span>
          </button>
        </div>
      </header>
      <main class="page">${inner}</main>
    </div>

    <nav class="botnav">${botnavItems()}</nav>
  </div>`;
}

function navItems() {
  let out = "";
  for (const grp of NAV) {
    const items = grp.items.filter(i => !i.business || isBusiness());
    if (!items.length) continue;
    if (grp.group) out += '<div class="nav-label">' + esc(grp.group) + "</div>";
    for (const it of items) {
      const active = S.route === it.id || (S.route === "flow" && S.flow && S.flow.nav === it.id);
      const count = it.id === "approvals" ? pendingCount() : 0;
      out += `<button class="nav-item ${active ? "active" : ""}" onclick="go('${it.id}')">
        ${icon(it.icon, 19)}<span>${esc(it.label)}</span>
        ${count ? '<span class="count">' + count + "</span>" : ""}
        ${it.isNew && !count ? '<span class="count" style="background:var(--lime);color:#3d4200">New</span>' : ""}
      </button>`;
    }
  }
  return out;
}

function botnavItems() {
  return BOTNAV.map(it => {
    const active = S.route === it.id;
    const count = it.id === "more" ? pendingCount() : 0;
    return `<button class="${active ? "active" : ""}" onclick="${it.id === "more" ? "openMore()" : "go('" + it.id + "')"}">
      ${icon(it.icon, 21)}<span>${esc(it.label)}</span>
      ${count ? '<span class="count">' + count + "</span>" : ""}
    </button>`;
  }).join("");
}

function openMore() {
  const items = NAV.flatMap(g => g.items).filter(i => !i.business || isBusiness());
  modal(`<div class="modal-host" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-head"><h3>All services</h3><div class="spacer"></div>
        <button class="icon-btn" onclick="closeModal()" aria-label="Close">${icon("close", 18)}</button></div>
      <div class="modal-body">
        <div class="qa-grid" style="grid-template-columns:repeat(3,1fr)">
          ${items.map(i => `<button class="qa" onclick="closeModal();go('${i.id}')">
            <span class="ico">${icon(i.icon, 19)}</span><span>${esc(i.label)}</span></button>`).join("")}
        </div>
        <button class="btn btn-secondary btn-block mt16" onclick="closeModal();signOut()">
          ${icon("logout", 18)} Sign out</button>
      </div>
    </div></div>`);
}

function openProfileSwitch() {
  modal(`<div class="modal-host" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-head"><h3>Switch profile</h3><div class="spacer"></div>
        <button class="icon-btn" onclick="closeModal()" aria-label="Close">${icon("close", 18)}</button></div>
      <div class="modal-body">
        <div class="radio-cards">
        ${CUSTOMER.profiles.map(p => `
          <button class="radio-card ${p.id === S.profileId ? "on" : ""}" onclick="switchProfile('${p.id}')">
            <span class="avatar ${p.type === "business" ? "navy" : ""}">${p.type === "business" ? icon("building", 16) : esc(CUSTOMER.initials)}</span>
            <span><span class="rc-title">${esc(p.label)}</span><span class="rc-sub">${esc(p.tier)}</span></span>
            ${p.id === S.profileId ? '<span class="rc-right" style="color:var(--ok)">' + icon("check", 18) + "</span>" : ""}
          </button>`).join("")}
        </div>
        <p class="tiny faint mt16 mb0">What you can do is set by the mandate on the profile you choose.
        Business profiles include payment approvals.</p>
      </div>
    </div></div>`);
}

function switchProfile(id) {
  S.profileId = id;
  S.accountId = accounts()[0].id;
  closeModal();
  go("dashboard");
  toast("Switched to " + profile().label, "check");
}

function openAccountMenu() {
  modal(`<div class="modal-host" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-head">
        <span class="avatar" style="width:42px;height:42px;font-size:15px">${esc(CUSTOMER.initials)}</span>
        <div><h3>${esc(CUSTOMER.name)}</h3>
        <div class="tiny faint">Last signed in ${shortDate(CUSTOMER.lastLogin)} at ${timeLabel(CUSTOMER.lastLogin)}</div></div>
        <div class="spacer"></div>
        <button class="icon-btn" onclick="closeModal()" aria-label="Close">${icon("close", 18)}</button>
      </div>
      <div class="modal-body">
        <div class="list card" style="box-shadow:none">
          <button class="list-row" onclick="closeModal();go('settings')">${icon("user", 18)}<span class="tx-body"><span class="tx-desc">Profile &amp; security</span></span>${icon("chevron", 16)}</button>
          <button class="list-row" onclick="closeModal();go('support')">${icon("support", 18)}<span class="tx-body"><span class="tx-desc">Get help</span></span>${icon("chevron", 16)}</button>
        </div>
        <button class="btn btn-secondary btn-block mt16" onclick="closeModal();signOut()">${icon("logout", 18)} Sign out</button>
      </div>
    </div></div>`);
}

function signOut() {
  S.signedIn = false; S.route = "auth"; S.newUser = false;
  render();
}

/* ---------------------------------------------------------------
   6. DASHBOARD
   --------------------------------------------------------------- */
function viewDashboard() {
  const accs = accounts();
  const zmw = accs.filter(a => a.currency === "ZMW").reduce((s, a) => s + a.balance, 0);
  const other = accs.filter(a => a.currency !== "ZMW");
  const recent = txForProfile().slice(0, 6);

  const quick = [
    { id: "transfer", label: "Transfer", icon: "transfer" },
    { id: "airtime", label: "Airtime", icon: "airtime" },
    { id: "utility", label: "Pay bill", icon: "bill" },
    { id: "fx", label: "Forex", icon: "fx" },
    { id: "statements", label: "Statements", icon: "statements" },
    { id: "locator", label: "Find us", icon: "locator" },
  ];

  return `
  <div class="page-head">
    <div class="page-head-row">
      <div>
        <h1>Good afternoon, ${esc(CUSTOMER.firstName)}</h1>
        <p>Here&rsquo;s where things stand today.</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary btn-sm" onclick="S.showBalances=!S.showBalances;render()">
          ${icon(S.showBalances ? "eyeOff" : "eye", 17)} ${S.showBalances ? "Hide" : "Show"} balances
        </button>
      </div>
    </div>
  </div>

  ${S.newUser ? `
  <div class="banner banner-ok mb16">
    <span class="b-ico">${icon("checkBig", 19)}</span>
    <div class="b-body"><b>Your account is active</b>
      <p>Start by checking your balance, then try sending money or buying airtime. Everything here is free to use.</p></div>
  </div>` : ""}

  ${isBusiness() && pendingCount() ? `
  <div class="banner banner-approve mb16">
    <span class="b-ico">${icon("approvals", 19)}</span>
    <div class="b-body"><b>${pendingCount()} payments waiting for your approval</b>
      <p>Raised by your team and held until you authorise them.</p></div>
    <button class="btn btn-cta btn-sm" onclick="go('approvals')">Review</button>
  </div>` : ""}

  <div class="total-strip mb16">
    <div>
      <div class="lbl">Total available &middot; Kwacha</div>
      <div class="val"><span class="cur">ZMW</span>${S.showBalances ? money(zmw) : "••••••"}</div>
      <div class="sub">Across ${accs.filter(a => a.currency === "ZMW").length} kwacha accounts</div>
    </div>
    ${other.map(a => `<div>
      <div class="lbl">${esc(a.currency)}</div>
      <div class="val"><span class="cur">${cur(a.currency)}</span>${S.showBalances ? money(a.balance) : "••••"}</div>
      <div class="sub">${esc(a.nickname)}</div>
    </div>`).join("")}
    <div class="side">
      <div class="lbl">As at</div>
      <div class="sub" style="font-size:13.5px;color:#DCE5F2">6 Sep 2026, 12:04</div>
    </div>
  </div>

  <div class="qa-grid mb24">
    ${quick.map(q => `<button class="qa" onclick="go('${q.id}')">
      <span class="ico">${icon(q.icon, 19)}</span><span>${esc(q.label)}</span></button>`).join("")}
  </div>

  <div class="grid-main">
    <div class="stack">
      <div class="card">
        <div class="card-head"><h2>Recent activity</h2>
          <div class="actions"><button class="btn btn-ghost btn-sm" onclick="go('transactions')">View all ${icon("chevron", 14)}</button></div>
        </div>
        <div class="list">${recent.map(txRow).join("")}</div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Your accounts</h2>
          <div class="actions"><button class="btn btn-ghost btn-sm" onclick="go('accounts')">Manage ${icon("chevron", 14)}</button></div>
        </div>
        <div class="list">
        ${accs.map(a => `<button class="list-row" onclick="openAccount('${a.id}')">
          <span class="tx-ico">${icon(a.type === "savings" ? "wallet" : "accounts", 18)}</span>
          <span class="tx-body">
            <span class="tx-desc">${esc(a.nickname)}</span>
            <span class="tx-meta">${esc(a.product)} &middot; ${maskAcc(a.number)}</span>
          </span>
          <span class="tx-amt"><span class="a num">${S.showBalances ? amt(a.balance, a.currency) : "••••"}</span>
          <span class="b">${esc(a.currency)}</span></span>
        </button>`).join("")}
        </div>
      </div>
    </div>

    <div class="stack">
      ${dashLoanCard()}
      ${dashUpcomingCard()}
      ${dashFxCard()}
    </div>
  </div>`;
}

function dashLoanCard() {
  const l = LOANS.find(x => x.profileId === S.profileId);
  if (!l) return "";
  const pct = Math.round(((l.principal - l.outstanding) / l.principal) * 100);
  return `
  <div class="card">
    <div class="card-head"><h2>Your loan</h2>
      <div class="actions"><button class="btn btn-ghost btn-sm" onclick="go('loans')">Details</button></div></div>
    <div class="card-pad">
      <div class="tiny faint">${esc(l.product)} &middot; ${esc(l.reference)}</div>
      <div style="font-size:22px;font-weight:600;letter-spacing:-.02em;margin:4px 0 2px" class="num">${amt(l.outstanding, l.currency)}</div>
      <div class="small muted mb16">outstanding of ${amt(l.principal, l.currency)}</div>
      <div style="height:6px;background:var(--surface-3);border-radius:3px;overflow:hidden;margin-bottom:8px">
        <div style="height:100%;width:${pct}%;background:var(--ok);border-radius:3px"></div>
      </div>
      <div class="row small muted" style="justify-content:space-between">
        <span>${pct}% repaid</span><span>${l.paid} of ${l.termMonths} instalments</span>
      </div>
      <div class="hr"></div>
      <div class="row" style="justify-content:space-between">
        <div><div class="tiny faint">Next instalment</div>
          <div class="b num">${amt(l.instalment, l.currency)}</div></div>
        <div style="text-align:right"><div class="tiny faint">Due</div>
          <div class="b">${shortDate(l.nextDue)}</div></div>
      </div>
    </div>
  </div>`;
}

function dashUpcomingCard() {
  const items = SCHEDULED.filter(s => s.active).slice(0, 3);
  return `
  <div class="card">
    <div class="card-head"><h2>Coming up</h2>
      <div class="actions"><button class="btn btn-ghost btn-sm" onclick="go('calendar')">All</button></div></div>
    <div class="list">
    ${items.map(s => `<div class="list-row static">
      <span class="tx-ico">${icon("scheduled", 17)}</span>
      <span class="tx-body"><span class="tx-desc">${esc(s.name)}</span>
        <span class="tx-meta">${esc(s.frequency)} &middot; ${shortDate(s.nextRun)}</span></span>
      <span class="tx-amt"><span class="a num">${amt(s.amount, s.currency)}</span></span>
    </div>`).join("")}
    </div>
  </div>`;
}

function dashFxCard() {
  return `
  <div class="card">
    <div class="card-head"><h2>Exchange rates</h2>
      <div class="actions"><span class="pill pill-new">New</span></div></div>
    <div class="list">
    ${FX_RATES.slice(0, 3).map(r => `<div class="list-row static" style="padding-top:10px;padding-bottom:10px">
      <span class="tx-body"><span class="tx-desc">${esc(r.pair)}</span>
      <span class="tx-meta">Buy ${r.buy.toFixed(2)} &middot; Sell ${r.sell.toFixed(2)}</span></span>
      <span class="tx-amt"><span class="a num" style="color:${r.change >= 0 ? "var(--ok)" : "var(--err)"};font-size:13px">
        ${r.change >= 0 ? "+" : ""}${r.change.toFixed(2)}</span></span>
    </div>`).join("")}
    </div>
    <div class="card-pad" style="padding-top:12px">
      <button class="btn btn-secondary btn-block btn-sm" onclick="go('fx')">Buy or sell currency</button>
    </div>
  </div>`;
}

/* transaction row (shared) */
function txRow(t) {
  const inbound = t.amount > 0;
  return `<button class="list-row" onclick="openTx('${t.id}')">
    <span class="tx-ico ${inbound ? "in" : "out"}">${icon(inbound ? "arrowDown" : "arrowUp", 17)}</span>
    <span class="tx-body">
      <span class="tx-desc">${esc(t.desc)}</span>
      <span class="tx-meta">${esc(t.detail || "")}${t.detail ? " &middot; " : ""}${dateLabel(t.date)}</span>
    </span>
    <span class="tx-amt">
      <span class="a num ${inbound ? "in" : ""}">${inbound ? "+" : "−"}${amt(t.amount, t.currency)}</span>
      <span class="b">${t.status === "pending" ? '<span class="pill pill-warn">Pending</span>' : esc(t.currency)}</span>
    </span>
  </button>`;
}

function openTx(id) {
  const t = TRANSACTIONS.find(x => x.id === id);
  if (!t) return;
  const inbound = t.amount > 0;
  modal(`<div class="modal-host" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-head"><h3>Transaction</h3><div class="spacer"></div>
        <button class="icon-btn" onclick="closeModal()" aria-label="Close">${icon("close", 18)}</button></div>
      <div class="modal-body">
        <div class="center mb16">
          <div style="font-size:29px;font-weight:600;letter-spacing:-.02em" class="num">
            ${inbound ? "+" : "−"}${amt(t.amount, t.currency)}</div>
          <div class="muted small">${esc(t.desc)}</div>
          <div class="mt8">${t.status === "pending"
            ? '<span class="pill pill-warn"><span class="led"></span>Pending</span>'
            : '<span class="pill pill-ok"><span class="led"></span>Completed</span>'}</div>
        </div>
        <div class="review">
          <div class="rv-row"><span class="k">Date</span><span class="v">${dateLabel(t.date)}, ${timeLabel(t.date)}</span></div>
          <div class="rv-row"><span class="k">Details</span><span class="v">${esc(t.detail || "—")}</span></div>
          <div class="rv-row"><span class="k">Category</span><span class="v">${esc(t.category)}</span></div>
          <div class="rv-row"><span class="k">Reference</span><span class="v mono">${esc(t.ref)}</span></div>
          <div class="rv-row"><span class="k">Fee</span><span class="v free">No fee</span></div>
          ${t.balance != null ? `<div class="rv-row"><span class="k">Balance after</span><span class="v num">${amt(t.balance, t.currency)}</span></div>` : ""}
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-secondary" onclick="toast('Receipt downloaded','download')">${icon("download", 17)} Receipt</button>
        <button class="btn btn-secondary" onclick="toast('Share sheet would open','share')">${icon("share", 17)} Share</button>
      </div>
    </div></div>`);
}

/* ---------------------------------------------------------------
   7. ACCOUNTS
   --------------------------------------------------------------- */
function viewAccounts() {
  const accs = accounts();
  return `
  <div class="page-head"><h1>Accounts</h1><p>All accounts on the ${esc(profile().label)} profile.</p></div>
  <div class="grid grid-2 mb24">
    ${accs.map(a => `
      <button class="acct-card ${a.type === "savings" ? "savings" : ""} ${a.currency !== "ZMW" ? "fx" : ""}" onclick="openAccount('${a.id}')">
        <span class="rail"></span>
        <span class="top"><span class="nick">${esc(a.nickname)}</span><span class="prod">${esc(a.product)}</span></span>
        <div class="num-line mono">${esc(a.number)}</div>
        <div class="bal num"><span class="cur">${esc(a.currency)}</span>${S.showBalances ? money(a.balance) : "••••••"}</div>
        <div class="avail num">Available ${S.showBalances ? amt(a.available, a.currency) : "••••"}
          ${a.interestRate ? " &middot; " + a.interestRate + "% p.a." : ""}</div>
      </button>`).join("")}
  </div>

  <div class="card">
    <div class="card-head"><h2>Loans</h2></div>
    <div class="list">
    ${LOANS.filter(l => l.profileId === S.profileId).map(l => `
      <button class="list-row" onclick="go('loan','${l.id}')">
        <span class="tx-ico">${icon("loans", 18)}</span>
        <span class="tx-body"><span class="tx-desc">${esc(l.product)}</span>
          <span class="tx-meta">${esc(l.reference)} &middot; next ${shortDate(l.nextDue)}</span></span>
        <span class="tx-amt"><span class="a num">${amt(l.outstanding, l.currency)}</span><span class="b">outstanding</span></span>
      </button>`).join("") || '<div class="empty"><p>No loans on this profile.</p></div>'}
    </div>
  </div>`;
}

function openAccount(id) { S.accountId = id; go("account", id); }

function viewAccount() {
  const a = account(S.param);
  const tx = txFor(a.id);
  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="go('accounts')">${icon("back", 16)} Accounts</button>
    <div class="page-head-row">
      <div><h1>${esc(a.nickname)}</h1><p>${esc(a.product)} &middot; <span class="mono">${esc(a.number)}</span></p></div>
      <div class="actions">
        <button class="btn btn-secondary btn-sm" onclick="go('statements')">${icon("statements", 17)} Statement</button>
        <button class="btn btn-primary btn-sm" onclick="startFlow('someone')">${icon("transfer", 17)} Send money</button>
      </div>
    </div>
  </div>

  <div class="grid grid-3 mb24">
    <div class="card card-pad">
      <div class="tiny faint mb8" style="letter-spacing:.1em;text-transform:uppercase">Book balance</div>
      <div style="font-size:26px;font-weight:600;letter-spacing:-.02em" class="num">${amt(a.balance, a.currency)}</div>
    </div>
    <div class="card card-pad">
      <div class="tiny faint mb8" style="letter-spacing:.1em;text-transform:uppercase">Available</div>
      <div style="font-size:26px;font-weight:600;letter-spacing:-.02em" class="num">${amt(a.available, a.currency)}</div>
    </div>
    <div class="card card-pad">
      <div class="tiny faint mb8" style="letter-spacing:.1em;text-transform:uppercase">Status</div>
      <div class="mt8"><span class="pill pill-ok"><span class="led"></span>Active</span>
      ${a.interestRate ? '<span class="pill pill-info" style="margin-left:6px">' + a.interestRate + "% p.a.</span>" : ""}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><h2>Breakdown of transactions</h2>
      <div class="actions">
        <button class="btn btn-secondary btn-sm" onclick="exportModal()">${icon("download", 16)} Export</button>
      </div></div>
    <div class="list">${tx.length ? groupedTx(tx) : emptyBlock("history", "No transactions yet", "Activity on this account will appear here.")}</div>
  </div>`;
}

/* ---------------------------------------------------------------
   8. TRANSACTIONS
   --------------------------------------------------------------- */
function viewTransactions() {
  let tx = txForProfile();
  if (S.txFilter === "in") tx = tx.filter(t => t.amount > 0);
  if (S.txFilter === "out") tx = tx.filter(t => t.amount < 0);
  if (S.txFilter === "pending") tx = tx.filter(t => t.status === "pending");
  if (S.txSearch) {
    const q = S.txSearch.toLowerCase();
    tx = tx.filter(t => (t.desc + " " + (t.detail || "") + " " + t.ref).toLowerCase().includes(q));
  }

  return `
  <div class="page-head">
    <div class="page-head-row">
      <div><h1>Transactions</h1><p>Everything across your accounts.</p></div>
      <div class="actions"><button class="btn btn-secondary btn-sm" onclick="exportModal()">${icon("download", 16)} Export</button></div>
    </div>
  </div>

  <div class="card mb16">
    <div class="card-pad" style="padding:14px 16px">
      <div class="row row-wrap" style="gap:10px">
        <div class="search-wrap">${icon("search", 17)}
          <input class="input" placeholder="Search description or reference"
            value="${esc(S.txSearch)}" oninput="S.txSearch=this.value;renderKeepFocus(this)">
        </div>
        <div class="seg">
          ${[["all", "All"], ["in", "Money in"], ["out", "Money out"], ["pending", "Pending"]]
            .map(([k, l]) => `<button class="${S.txFilter === k ? "active" : ""}" onclick="S.txFilter='${k}';render()">${l}</button>`).join("")}
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="list">${tx.length ? groupedTx(tx)
      : emptyBlock("search", "Nothing matches that", "Try a different search or clear the filter.")}</div>
  </div>`;
}

function groupedTx(list) {
  let out = "", lastDay = "";
  for (const t of list) {
    const d = dateLabel(t.date);
    if (d !== lastDay) { out += '<div class="day-sep">' + esc(d) + "</div>"; lastDay = d; }
    out += txRow(t);
  }
  return out;
}

function renderKeepFocus(el) {
  const id = el.getAttribute("data-k") || "search";
  el.setAttribute("data-k", id);
  const pos = el.selectionStart;
  render();
  const next = document.querySelector('[data-k="' + id + '"]') || document.querySelector(".search-wrap .input");
  if (next) { next.focus(); try { next.setSelectionRange(pos, pos); } catch (e) {} }
}

function exportModal() {
  modal(`<div class="modal-host" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-head"><h3>Export transactions</h3><div class="spacer"></div>
        <button class="icon-btn" onclick="closeModal()" aria-label="Close">${icon("close", 18)}</button></div>
      <div class="modal-body">
        <div class="field"><label>Period</label>
          <select class="select"><option>Last 30 days</option><option>Last 3 months</option>
          <option>Last 6 months</option><option>Custom range</option></select></div>
        <div class="field"><label>Format</label>
          <div class="radio-cards">
            <button class="radio-card on">${icon("doc", 18)}<span><span class="rc-title">PDF</span>
              <span class="rc-sub">For records and sharing</span></span></button>
            <button class="radio-card">${icon("grid", 18)}<span><span class="rc-title">Excel (.xlsx)</span>
              <span class="rc-sub">For reconciliation and accounting</span></span>
              <span class="rc-right"><span class="pill pill-new">New</span></span></button>
            <button class="radio-card">${icon("doc", 18)}<span><span class="rc-title">CSV</span>
              <span class="rc-sub">For import into other systems</span></span></button>
          </div></div>
        <div class="fee-note">${icon("info", 16)}
          <span>Statements for the last 30 days are free. Older statements are charged at K5 per page
          when fees are introduced.</span></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="closeModal();toast('Statement downloaded','download')">Download</button>
      </div>
    </div></div>`);
}

function emptyBlock(ic, title, body) {
  return `<div class="empty"><div class="e-ico">${icon(ic, 22)}</div>
    <h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
}

/* ---------------------------------------------------------------
   9. TRANSFER HUB
   --------------------------------------------------------------- */
function viewTransfer() {
  const opts = [
    { k: "own", icon: "own", title: "Between my accounts", sub: "Move money instantly, no fee" },
    { k: "abbank", icon: "bank", title: "To an AB Bank account", sub: "Instant to any AB Bank customer" },
    { k: "someone", icon: "transfer", title: "To another bank", sub: "Via the national switch — arrives in minutes" },
    { k: "mobile", icon: "phone", title: "To a mobile money wallet", sub: "Airtel, MTN or Zamtel", isNew: true },
    { k: "swift", icon: "fx", title: "International transfer", sub: "SWIFT payment in USD, EUR or GBP" },
  ];
  return `
  <div class="page-head"><h1>Transfer</h1><p>Where is the money going?</p></div>

  <div class="flow">
    <div class="radio-cards mb24">
      ${opts.map(o => `<button class="radio-card" onclick="startFlow('${o.k}')">
        <span class="tx-ico">${icon(o.icon, 18)}</span>
        <span><span class="rc-title">${esc(o.title)} ${o.isNew ? '<span class="pill pill-new" style="margin-left:5px">New</span>' : ""}</span>
        <span class="rc-sub">${esc(o.sub)}</span></span>
        <span class="rc-right faint">${icon("chevron", 17)}</span>
      </button>`).join("")}
    </div>

    <div class="card">
      <div class="card-head"><h2>Send again</h2>
        <div class="actions"><button class="btn btn-ghost btn-sm" onclick="go('templates')">All templates</button></div></div>
      <div class="list">
      ${TEMPLATES.slice(0, 4).map(t => `<button class="list-row" onclick="startFlowFromTemplate('${t.id}')">
        <span class="avatar sm" style="background:var(--surface-3);color:var(--ink-2)">${esc(initialsOf(t.name))}</span>
        <span class="tx-body"><span class="tx-desc">${esc(t.name)}</span>
          <span class="tx-meta">${t.type === "mobile"
            ? esc((MNOS.find(m => m.id === t.mno) || {}).short || "") + " &middot; " + esc(t.accountNumber)
            : esc((bankByCode(t.bank) || {}).short || "") + " &middot; " + maskAcc(t.accountNumber)}</span></span>
        <span class="tx-amt faint">${icon("chevron", 16)}</span>
      </button>`).join("")}
      </div>
    </div>
  </div>`;
}

function initialsOf(name) {
  return String(name).split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

/* ---------------------------------------------------------------
   10. FLOW ENGINE  (form -> review -> authorise -> receipt)
   --------------------------------------------------------------- */
const FLOW_DEF = {
  own:     { nav: "transfer", title: "Between my accounts", route: "transfer/to-own-account" },
  abbank:  { nav: "transfer", title: "To an AB Bank account", route: "transfer/to-someones-account" },
  someone: { nav: "transfer", title: "To another bank", route: "transfer/to-someones-account" },
  mobile:  { nav: "transfer", title: "To mobile money", route: "transfer/by-mobile-or-pn" },
  swift:   { nav: "transfer", title: "International transfer", route: "transfer/to-someones-account" },
  utility: { nav: "utility",  title: "Pay a bill", route: "transfer/utility" },
  airtime: { nav: "airtime",  title: "Airtime & data", route: "transfer/airtime" },
  fx:      { nav: "fx",       title: "Foreign exchange", route: "fx" },
};

function startFlow(kind) {
  S.flow = {
    kind, step: "form", nav: FLOW_DEF[kind].nav,
    from: accounts()[0].id, to: "", amount: "", ref: "",
    bank: "ZNCBK", biller: "zesco", bundleKind: "airtime", bundle: null,
    phone: "", saveTemplate: false, fxDir: "buy", fxPair: "USD/ZMW",
  };
  if (kind === "own") S.flow.toAcct = (accounts()[1] || accounts()[0]).id;
  go("flow");
}

/* Choosing a saved beneficiary fills in everything we already know —
   destination, bank, network, recipient name. The amount is the only
   thing left for the customer to type. */
function startFlowFromTemplate(id) {
  const t = TEMPLATES.find(x => x.id === id);
  if (!t) return;
  const kind = t.type === "mobile" ? "mobile" : (t.bank === "ABBAK" ? "abbank" : "someone");
  startFlow(kind);
  const f = S.flow;
  f.fromTemplate = t.id;
  f.beneficiaryName = t.name;
  if (t.type === "mobile") {
    f.phone = t.accountNumber;
    f.to = t.accountNumber;
  } else {
    f.to = t.accountNumber;
    f.bank = t.bank;
  }
  f.saveTemplate = false;   // already saved
  render();
}

function fset(k, v) { S.flow[k] = v; }

/* Step back out of a template without losing the payment being made. */
function clearTemplate() {
  const f = S.flow;
  f.fromTemplate = null; f.beneficiaryName = null;
  f.to = ""; f.phone = "";
  render();
}
function fsetRender(k, v) { S.flow[k] = v; render(); }

function viewFlow() {
  const f = S.flow;
  if (!f) return viewDashboard();
  const def = FLOW_DEF[f.kind];

  if (f.step === "done") return flowReceipt();

  const steps = ["Details", "Review", "Authorise"];
  const idx = f.step === "form" ? 0 : (f.step === "review" ? 1 : 2);

  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="flowBack()">${icon("back", 16)} Back</button>
    <h1>${esc(def.title)}</h1>
    <p class="mono tiny faint">${esc(def.route)}</p>
  </div>

  <div class="flow">
    <div class="stepper">
      ${steps.map((s, i) => `<span class="st ${i === idx ? "on" : ""} ${i < idx ? "done" : ""}">
        <span class="n">${i < idx ? "✓" : i + 1}</span> ${s}</span>${i < 2 ? '<span class="bar"></span>' : ""}`).join("")}
    </div>
    ${f.step === "form" ? flowForm() : flowReview()}
  </div>`;
}

function flowBack() {
  const f = S.flow;
  if (!f) return go("dashboard");
  if (f.step === "review") { f.step = "form"; return render(); }
  go(f.nav);
}

/* ---- form step ---- */
function flowForm() {
  const f = S.flow;
  const from = account(f.from);
  let body = "";

  const fromField = `
    <div class="field">
      <label>Pay from</label>
      <select class="select" onchange="fsetRender('from',this.value)">
        ${accounts().map(a => `<option value="${a.id}" ${a.id === f.from ? "selected" : ""}>
          ${esc(a.nickname)} — ${esc(a.currency)} ${money(a.available)} available</option>`).join("")}
      </select>
    </div>`;

  const amountField = (currency) => `
    <div class="field">
      <label>Amount</label>
      <div class="amount-field">
        <span class="cur-tag">${esc(currency || from.currency)}</span>
        <input class="input num" inputmode="decimal" placeholder="0.00"
          value="${esc(f.amount)}" oninput="fset('amount',this.value)">
      </div>
      <div class="hint">Available ${amt(from.available, from.currency)}</div>
    </div>`;

  const refField = `
    <div class="field">
      <label>Reference <span class="faint" style="font-weight:400">(optional)</span></label>
      <input class="input" maxlength="30" placeholder="What is this for?"
        value="${esc(f.ref)}" oninput="fset('ref',this.value)">
      <div class="hint">Shown on your statement and the recipient&rsquo;s.</div>
    </div>`;

  if (f.kind === "own") {
    body = fromField + `
      <div class="field">
        <label>Transfer to</label>
        <select class="select" onchange="fsetRender('toAcct',this.value)">
          ${accounts().filter(a => a.id !== f.from).map(a => `<option value="${a.id}" ${a.id === f.toAcct ? "selected" : ""}>
            ${esc(a.nickname)} — ${esc(a.currency)} ${esc(a.number)}</option>`).join("")}
        </select>
      </div>` + amountField() + refField;

  } else if (f.kind === "mobile") {
    const m = mnoFor(f.phone);
    const nm = lookupName(f.phone);
    body = fromField + `
      <div class="field">
        <label>Mobile number</label>
        <div class="input-wrap">
          <input class="input" inputmode="tel" placeholder="097 123 4567" maxlength="13"
            value="${esc(f.phone)}" oninput="fset('phone',this.value);flowLive()" style="padding-right:120px">
          <div class="trail" id="mno-chip">${m ? mnoChip(m) : ""}</div>
        </div>
        <div class="hint" id="mno-hint">${m ? "" : "Airtel, MTN or Zamtel."}</div>
      </div>
      ${nm ? nameConfirm(nm) : ""}
      ` + amountField() + refField + saveTemplateField();

  } else if (f.kind === "abbank" || f.kind === "someone" || f.kind === "swift") {
    const isOther = f.kind !== "abbank";
    const b = bankByCode(f.bank);
    const nm = lookupName(f.to);
    body = fromField +
      (isOther ? `
      <div class="field">
        <label>Receiving bank</label>
        <select class="select" onchange="fsetRender('bank',this.value)">
          ${BANKS.filter(x => x.code !== "ABBAK").map(x => `<option value="${x.code}" ${x.code === f.bank ? "selected" : ""}>${esc(x.name)}</option>`).join("")}
        </select>
      </div>` : "") + `
      <div class="field">
        <label>Account number</label>
        <input class="input mono" inputmode="numeric" placeholder="0100224419"
          value="${esc(f.to)}" oninput="fset('to',this.value);flowLive()">
      </div>
      ${nm ? nameConfirm(nm) : (f.to && f.to.length > 6 ? nameChecking() : "")}
      ` + amountField() + refField + saveTemplateField();

  } else if (f.kind === "utility") {
    const bl = BILLERS.find(x => x.id === f.biller) || BILLERS[0];
    body = fromField + `
      <div class="field">
        <label>Who are you paying?</label>
        <select class="select" onchange="fsetRender('biller',this.value)">
          ${["Electricity", "Water", "TV", "Education", "Government"].map(cat => `
            <optgroup label="${esc(cat)}">
              ${BILLERS.filter(x => x.category === cat).map(x => `<option value="${x.id}" ${x.id === f.biller ? "selected" : ""}>
                ${esc(x.name)}${x.badge ? " (new)" : ""}</option>`).join("")}
            </optgroup>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>${esc(bl.field)}</label>
        <input class="input mono" placeholder="${esc(bl.placeholder)}"
          value="${esc(f.to)}" oninput="fset('to',this.value)">
        ${bl.prepaid ? '<div class="hint">Your token will be sent by SMS and shown on the receipt.</div>' : ""}
      </div>` + amountField() + saveTemplateField();

  } else if (f.kind === "airtime") {
    const m = mnoFor(f.phone);
    const bundles = m ? (BUNDLES[m.id] || []) : [];
    body = fromField + `
      <div class="field">
        <label>Mobile number</label>
        <div class="input-wrap">
          <input class="input" inputmode="tel" placeholder="097 123 4567" maxlength="13"
            value="${esc(f.phone)}" oninput="fset('phone',this.value);flowLive()" style="padding-right:120px">
          <div class="trail" id="mno-chip">${m ? mnoChip(m) : ""}</div>
        </div>
        <div class="hint">
          <button class="btn btn-ghost btn-sm" style="padding:2px 0"
            onclick="fset('phone','${esc(CUSTOMER.phone)}');flowLive();render()">Use my number (${maskPhone(CUSTOMER.phone)})</button>
        </div>
      </div>
      <div class="field">
        <label>What are you buying?</label>
        <div class="seg">
          <button class="${f.bundleKind === "airtime" ? "active" : ""}" onclick="fsetRender('bundleKind','airtime')">Airtime</button>
          <button class="${f.bundleKind === "data" ? "active" : ""}" onclick="fsetRender('bundleKind','data')">Data bundle</button>
        </div>
      </div>`;

    if (f.bundleKind === "data") {
      body += `<div class="field"><label>Choose a bundle</label>
        ${m ? `<div class="radio-cards">
          ${bundles.map(bd => `<button class="radio-card ${f.bundle === bd.id ? "on" : ""}" onclick="fset('amount','${bd.price}');fsetRender('bundle','${bd.id}')">
            <span><span class="rc-title">${esc(bd.label)}</span><span class="rc-sub">Valid ${esc(bd.validity)}</span></span>
            <span class="rc-right b num">K${bd.price}</span></button>`).join("")}
        </div>` : '<div class="hint">Enter a mobile number first and we’ll show that network’s bundles.</div>'}
      </div>`;
    } else {
      body += `<div class="field"><label>Amount</label>
        <div class="row row-wrap mb8" style="gap:7px">
          ${[10, 20, 50, 100, 200].map(v => `<button class="btn btn-secondary btn-sm" onclick="fset('amount','${v}');render()">K${v}</button>`).join("")}
        </div>
        <div class="amount-field"><span class="cur-tag">ZMW</span>
          <input class="input num" inputmode="decimal" placeholder="0.00" value="${esc(f.amount)}" oninput="fset('amount',this.value)">
        </div></div>`;
    }

  } else if (f.kind === "fx") {
    const r = FX_RATES.find(x => x.pair === f.fxPair) || FX_RATES[0];
    const rate = f.fxDir === "buy" ? r.sell : r.buy;
    const val = parseFloat(f.amount) || 0;
    body = `
      <div class="field"><label>What do you want to do?</label>
        <div class="seg">
          <button class="${f.fxDir === "buy" ? "active" : ""}" onclick="fsetRender('fxDir','buy')">Buy foreign currency</button>
          <button class="${f.fxDir === "sell" ? "active" : ""}" onclick="fsetRender('fxDir','sell')">Sell foreign currency</button>
        </div></div>
      <div class="field"><label>Currency</label>
        <select class="select" onchange="fsetRender('fxPair',this.value)">
          ${FX_RATES.map(x => `<option value="${x.pair}" ${x.pair === f.fxPair ? "selected" : ""}>${esc(x.pair)}</option>`).join("")}
        </select></div>
      ${fromField}
      <div class="field"><label>Amount in ${esc(f.fxPair.split("/")[0])}</label>
        <div class="amount-field"><span class="cur-tag">${esc(f.fxPair.split("/")[0])}</span>
          <input class="input num" inputmode="decimal" placeholder="0.00" value="${esc(f.amount)}" oninput="fset('amount',this.value);flowLive()">
        </div></div>
      <div class="card card-pad" style="background:var(--surface-2)">
        <div class="row" style="justify-content:space-between">
          <span class="muted small">Rate applied</span><span class="b num">${rate.toFixed(4)}</span></div>
        <div class="hr" style="margin:10px 0"></div>
        <div class="row" style="justify-content:space-between">
          <span class="muted small">${f.fxDir === "buy" ? "You pay" : "You receive"}</span>
          <span class="b num" style="font-size:19px">K${money(val * rate)}</span></div>
        <div class="tiny faint mt8">Indicative. The rate is fixed when you authorise, and holds for 60 seconds.</div>
      </div>`;
  }

  const disabled = !flowValid();
  const tpl = f.fromTemplate ? TEMPLATES.find(t => t.id === f.fromTemplate) : null;
  return `
    ${tpl ? `<div class="banner banner-info mb16">
      <span class="b-ico">${icon("templates", 18)}</span>
      <div class="b-body"><b>Paying ${esc(tpl.name)}</b>
        <p>Details filled in from your saved template. Just enter the amount.</p></div>
      <button class="btn btn-ghost btn-sm" onclick="clearTemplate()">Change</button>
    </div>` : ""}
    <div class="card card-pad mb16">${body}</div>
    <button class="btn btn-primary btn-lg btn-block" ${disabled ? "disabled" : ""} onclick="flowToReview()">Continue</button>
    ${disabled ? '<p class="tiny faint center mt8">Fill in the details above to continue.</p>' : ""}`;
}

function mnoChip(m) {
  return `<span class="detect-chip"><span class="swatch" style="background:${m.colour}"></span>${esc(m.short)}</span>`;
}
function nameConfirm(name) {
  return `<div class="banner banner-ok mb16">
    <span class="b-ico">${icon("check", 18)}</span>
    <div class="b-body"><b>${esc(name)}</b><p>Check this is who you meant to pay.</p></div>
  </div>`;
}
function nameChecking() {
  return `<div class="banner mb16"><span class="b-ico faint">${icon("clock", 18)}</span>
    <div class="b-body"><b class="muted">Checking account name…</b>
    <p>We confirm the name before you send.</p></div></div>`;
}
function saveTemplateField() {
  return `<label class="row small" style="gap:9px;cursor:pointer;margin-top:4px">
    <input type="checkbox" ${S.flow.saveTemplate ? "checked" : ""} onchange="fset('saveTemplate',this.checked)">
    Save as a template for next time</label>`;
}

/* live-update the small bits without a full re-render losing focus */
function flowLive() {
  const f = S.flow;
  const chip = document.getElementById("mno-chip");
  if (chip) {
    const m = mnoFor(f.phone);
    chip.innerHTML = m ? mnoChip(m) : "";
  }
}

function flowValid() {
  const f = S.flow;
  const a = parseFloat(f.amount) || 0;
  if (f.kind === "own") return a > 0 && f.toAcct;
  if (f.kind === "mobile") return a > 0 && !!mnoFor(f.phone);
  if (f.kind === "airtime") return a > 0 && !!mnoFor(f.phone);
  if (f.kind === "utility") return a > 0 && f.to.length > 3;
  if (f.kind === "fx") return a > 0;
  return a > 0 && f.to.length > 5;
}

function flowToReview() { S.flow.step = "review"; render(); }

/* ---- review step ---- */
function flowReview() {
  const f = S.flow;
  const from = account(f.from);
  const d = flowSummary();
  return `
    <div class="review mb16">
      <div class="rv-head">
        <div class="amt num"><span class="cur">${esc(d.currency)}</span>${money(d.amount)}</div>
        <div class="to">to ${esc(d.toLabel)}</div>
      </div>
      ${d.rows.map(r => `<div class="rv-row"><span class="k">${esc(r[0])}</span>
        <span class="v ${r[2] || ""}">${r[1]}</span></div>`).join("")}
      <div class="rv-row total"><span class="k">Total to pay</span>
        <span class="v num">${cur(d.currency)}${money(d.amount)}</span></div>
    </div>

    <div class="fee-note mb16">${icon("info", 16)}
      <span><b>No fee for this payment.</b> Online banking is currently free.
      If fees are introduced you will always see them here before you authorise.</span></div>

    ${isBusiness() && d.amount > CUSTOMER.entitlements.approvalLimit ? `
    <div class="banner banner-warn mb16"><span class="b-ico">${icon("approvals", 18)}</span>
      <div class="b-body"><b>This needs a second approval</b>
      <p>It is above your ${amt(CUSTOMER.entitlements.approvalLimit, "ZMW")} limit, so it will be held until another mandate holder approves it.</p></div>
    </div>` : ""}

    <div class="row" style="gap:9px">
      <button class="btn btn-secondary" style="flex:1" onclick="flowBack()">Back</button>
      <button class="btn btn-cta" style="flex:2" onclick="flowAuthorise()">${icon("lock", 17)} Authorise</button>
    </div>`;
}

function flowSummary() {
  const f = S.flow;
  const from = account(f.from);
  const a = parseFloat(f.amount) || 0;
  const rows = [["From", esc(from.nickname) + " &middot; " + maskAcc(from.number)]];
  let toLabel = "", currency = from.currency;

  if (f.kind === "own") {
    const t = account(f.toAcct);
    toLabel = t.nickname;
    rows.push(["To", esc(t.nickname) + " &middot; " + maskAcc(t.number)]);
    rows.push(["Arrives", "Immediately"]);
  } else if (f.kind === "mobile") {
    const m = mnoFor(f.phone);
    toLabel = (lookupName(f.phone) || f.phone);
    rows.push(["Mobile number", esc(f.phone)]);
    rows.push(["Network", m ? esc(m.name) : "—"]);
    rows.push(["Recipient", esc(lookupName(f.phone) || "Unregistered wallet")]);
    rows.push(["Arrives", "Within a minute"]);
  } else if (f.kind === "utility") {
    const bl = BILLERS.find(x => x.id === f.biller);
    toLabel = bl.name;
    rows.push(["Biller", esc(bl.name)]);
    rows.push([bl.field, esc(f.to)]);
    if (bl.prepaid) rows.push(["Token", "Sent by SMS after payment"]);
  } else if (f.kind === "airtime") {
    const m = mnoFor(f.phone);
    const bd = (BUNDLES[m ? m.id : "mtn"] || []).find(x => x.id === f.bundle);
    toLabel = f.phone;
    rows.push(["Mobile number", esc(f.phone)]);
    rows.push(["Network", m ? esc(m.name) : "—"]);
    rows.push(["Product", f.bundleKind === "data" && bd ? esc(bd.label) + " &middot; " + esc(bd.validity) : "Airtime top-up"]);
  } else if (f.kind === "fx") {
    const r = FX_RATES.find(x => x.pair === f.fxPair) || FX_RATES[0];
    const rate = f.fxDir === "buy" ? r.sell : r.buy;
    toLabel = f.fxDir === "buy" ? "your " + f.fxPair.split("/")[0] + " account" : "your kwacha account";
    rows.push(["Instruction", f.fxDir === "buy" ? "Buy " + esc(f.fxPair.split("/")[0]) : "Sell " + esc(f.fxPair.split("/")[0])]);
    rows.push(["Rate", '<span class="num">' + rate.toFixed(4) + "</span>"]);
    rows.push(["Kwacha value", '<span class="num">K' + money(a * rate) + "</span>"]);
    currency = f.fxPair.split("/")[0];
  } else {
    const b = bankByCode(f.bank);
    toLabel = lookupName(f.to) || f.to;
    if (f.kind !== "abbank") {
      rows.push(["Bank", esc(b.name)]);
      // SWIFT stays on international payments — the customer needs it for their records.
      if (f.kind === "swift") rows.push(["SWIFT / BIC", '<span class="mono">' + esc(b.swift) + "</span>"]);
    } else {
      rows.push(["Bank", "AB Bank Zambia"]);
    }
    rows.push(["Account number", '<span class="mono">' + esc(f.to) + "</span>"]);
    rows.push(["Recipient", esc(lookupName(f.to) || "Name not returned")]);
    rows.push(["Arrives", f.kind === "abbank" ? "Immediately" : (f.kind === "swift" ? "2–3 working days" : "Within minutes")]);
  }

  if (f.ref) rows.push(["Reference", esc(f.ref)]);
  rows.push(["Fee", "No fee", "free"]);
  return { amount: a, currency, toLabel, rows };
}

function flowAuthorise() {
  modal(otpModal({
    title: "Authorise this payment",
    body: "Enter the 6-digit code we sent to " + maskPhone(CUSTOMER.phone) + ".",
    onDone: "flowComplete()",
  }));
}

function flowComplete() {
  closeModal();
  S.flow.step = "done";
  S.flow.ref = S.flow.ref || "";
  S.flow.receiptRef = "ABZ" + Math.floor(1000000 + Math.random() * 8999999);
  render();
}

function flowReceipt() {
  const f = S.flow;
  const d = flowSummary();
  const held = isBusiness() && d.amount > CUSTOMER.entitlements.approvalLimit;
  return `
  <div class="page" style="padding-top:8px">
    <div class="receipt">
      <div class="tick" style="${held ? "background:var(--warn-050);color:var(--warn)" : ""}">
        ${icon(held ? "clock" : "checkBig", 30)}</div>
      <h2>${held ? "Sent for approval" : "Payment sent"}</h2>
      <p class="sub">${held
        ? "It will be released once another mandate holder approves it."
        : "The money is on its way."}</p>

      <div class="amt-big num"><span class="cur">${esc(d.currency)}</span>${money(d.amount)}</div>
      <p class="sub">to ${esc(d.toLabel)}</p>

      <div class="review receipt-body mb16">
        ${d.rows.map(r => `<div class="rv-row"><span class="k">${esc(r[0])}</span>
          <span class="v ${r[2] || ""}">${r[1]}</span></div>`).join("")}
        <div class="rv-row"><span class="k">Reference</span>
          <span class="v mono">${esc(f.receiptRef)}</span></div>
        <div class="rv-row"><span class="k">Date</span><span class="v">6 Sep 2026, 12:0${Math.floor(Math.random() * 9)}</span></div>
      </div>

      <div class="row" style="gap:9px">
        <button class="btn btn-secondary" style="flex:1" onclick="toast('Receipt downloaded','download')">
          ${icon("download", 17)} Receipt</button>
        <button class="btn btn-secondary" style="flex:1" onclick="toast('Share sheet would open','share')">
          ${icon("share", 17)} Share</button>
      </div>
      <button class="btn btn-primary btn-block mt16" onclick="go('dashboard')">Done</button>
      <button class="btn btn-ghost btn-block mt8" onclick="startFlow('${f.kind}')">Make another payment</button>
    </div>
  </div>`;
}

/* shared OTP modal */
function otpModal(o) {
  return `<div class="modal-host">
    <div class="modal">
      <div class="modal-head"><h3>${esc(o.title)}</h3><div class="spacer"></div>
        <button class="icon-btn" onclick="closeModal()" aria-label="Close">${icon("close", 18)}</button></div>
      <div class="modal-body">
        <p class="muted small" style="margin-top:0">${esc(o.body)}</p>
        <div class="otp-row">
          ${[0, 1, 2, 3, 4, 5].map(i => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}"
            oninput="otpAdvance(this,${i})" value="${i < 6 ? "" : ""}">`).join("")}
        </div>
        <p class="tiny faint center mt8">Didn&rsquo;t get it?
          <a href="#" onclick="event.preventDefault();toast('New code sent')">Send again</a>
          &middot; expires in 4:58</p>
        <div class="banner banner-warn mt16" style="font-size:12.5px">
          <span class="b-ico">${icon("shield", 16)}</span>
          <div class="b-body"><p>AB Bank will never call or message you asking for this code.</p></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="${o.onDone}">Confirm</button>
      </div>
    </div></div>`;
}

function otpAdvance(el, i) {
  if (el.value && i < 5) {
    const all = el.parentElement.querySelectorAll("input");
    if (all[i + 1]) all[i + 1].focus();
  }
}

/* ---------------------------------------------------------------
   11. APPROVALS
   --------------------------------------------------------------- */
function viewApprovals() {
  if (!isBusiness()) {
    return `<div class="page-head"><h1>Approvals</h1></div>
      <div class="card">${emptyBlock("approvals", "Nothing to approve",
        "Approvals apply to business profiles. Switch to Mwale General Dealers Ltd to see payments waiting.")}</div>`;
  }
  const total = APPROVALS.reduce((s, a) => s + a.amount, 0);
  return `
  <div class="page-head">
    <div class="page-head-row">
      <div><h1>Approvals</h1><p>Payments raised by your team, waiting for you.</p></div>
      <div class="actions">
        <button class="btn btn-secondary btn-sm" onclick="toast('All payments rejected','close')">Reject all</button>
        <button class="btn btn-ok btn-sm" onclick="approveAll()">${icon("check", 16)} Approve all</button>
      </div>
    </div>
  </div>

  <div class="grid grid-3 mb16">
    <div class="card card-pad"><div class="tiny faint mb8" style="letter-spacing:.1em;text-transform:uppercase">Waiting</div>
      <div style="font-size:26px;font-weight:600" class="num">${APPROVALS.length}</div></div>
    <div class="card card-pad"><div class="tiny faint mb8" style="letter-spacing:.1em;text-transform:uppercase">Total value</div>
      <div style="font-size:26px;font-weight:600" class="num">${amt(total, "ZMW")}</div></div>
    <div class="card card-pad"><div class="tiny faint mb8" style="letter-spacing:.1em;text-transform:uppercase">Your limit</div>
      <div style="font-size:26px;font-weight:600" class="num">${amt(CUSTOMER.entitlements.approvalLimit, "ZMW")}</div></div>
  </div>

  <div class="stack">
  ${APPROVALS.map(a => `
    <div class="card">
      <div class="card-head">
        <span class="avatar sm" style="background:var(--surface-3);color:var(--ink-2)">${esc(initialsOf(a.raisedBy))}</span>
        <div><h3>${esc(a.type)}</h3>
          <div class="tiny faint">Raised by ${esc(a.raisedBy)} &middot; ${dateLabel(a.raisedAt)} ${timeLabel(a.raisedAt)}</div></div>
        <div class="actions"><span class="pill pill-warn"><span class="led"></span>Waiting</span></div>
      </div>
      <div class="card-pad">
        <div class="row row-wrap" style="gap:24px;margin-bottom:14px">
          <div><div class="tiny faint">Amount</div>
            <div style="font-size:22px;font-weight:600" class="num">${amt(a.amount, a.currency)}</div></div>
          <div><div class="tiny faint">Beneficiary</div><div class="b">${esc(a.beneficiary)}</div></div>
          <div><div class="tiny faint">${a.bank ? "Bank &middot; account" : "Number"}</div>
            <div class="b mono">${a.bank ? esc((bankByCode(a.bank) || {}).short) + " &middot; " : ""}${esc(a.accountNumber)}</div></div>
          <div><div class="tiny faint">Reference</div><div class="b">${esc(a.reference)}</div></div>
        </div>
        <div class="row" style="gap:9px">
          <button class="btn btn-danger" onclick="rejectOne('${a.id}')">Reject</button>
          <button class="btn btn-ok" onclick="approveOne('${a.id}')">${icon("check", 16)} Approve</button>
          <div class="spacer"></div>
          <span class="tiny faint">Within your limit</span>
        </div>
      </div>
    </div>`).join("")}
  </div>`;
}

function approveOne(id) {
  const i = APPROVALS.findIndex(a => a.id === id);
  if (i < 0) return;
  modal(otpModal({ title: "Approve payment", body: "Enter the 6-digit code sent to " + maskPhone(CUSTOMER.phone) + ".",
    onDone: "confirmApprove('" + id + "')" }));
}
function confirmApprove(id) {
  closeModal();
  const i = APPROVALS.findIndex(a => a.id === id);
  if (i >= 0) APPROVALS.splice(i, 1);
  render(); toast("Payment approved and released", "check");
}
function rejectOne(id) {
  const i = APPROVALS.findIndex(a => a.id === id);
  if (i >= 0) APPROVALS.splice(i, 1);
  render(); toast("Successfully rejected", "close");
}
function approveAll() {
  APPROVALS.length = 0; render(); toast("All payments approved", "check");
}

/* ---------------------------------------------------------------
   12. TEMPLATES
   --------------------------------------------------------------- */
function viewTemplates() {
  return `
  <div class="page-head">
    <div class="page-head-row">
      <div><h1>Templates</h1><p>Saved beneficiaries you can pay again in two taps.</p></div>
      <div class="actions"><button class="btn btn-primary btn-sm" onclick="startTemplateForm()">${icon("plus", 16)} Add new template</button></div>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><h2>Most used</h2></div>
    <div class="list">
    ${TEMPLATES.slice().sort((a, b) => b.uses - a.uses).map(t => `
      <div class="list-row static tpl-row">
        <span class="avatar sm" style="background:var(--surface-3);color:var(--ink-2)">${esc(initialsOf(t.name))}</span>
        <span class="tx-body">
          <span class="tx-desc">${esc(t.name)}</span>
          <span class="tx-meta">${t.type === "mobile"
            ? esc((MNOS.find(m => m.id === t.mno) || {}).name || "") + " &middot; " + esc(t.accountNumber)
            : esc((bankByCode(t.bank) || {}).name || "") + " &middot; " + esc(t.accountNumber)}</span>
        </span>
        <span class="tx-amt tpl-stats" style="margin-right:10px"><span class="b tiny faint">${t.uses} payments</span>
          <span class="b tiny faint">last ${shortDate(t.lastUsed)}</span></span>
        <span class="row tpl-actions" style="gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="startFlowFromTemplate('${t.id}')">Pay</button>
          <button class="icon-btn" onclick="startTemplateForm('${t.id}')" aria-label="Edit">${icon("edit", 17)}</button>
        </span>
      </div>`).join("")}
    </div>
  </div>`;
}

/* ---------------------------------------------------------------
   13. LOANS
   --------------------------------------------------------------- */
function viewLoans() {
  const mine = LOANS.filter(l => l.profileId === S.profileId);
  return `
  <div class="page-head">
    <div class="page-head-row">
      <div><h1>Loans</h1><p>Your borrowing with AB Bank.</p></div>
      <div class="actions"><button class="btn btn-cta btn-sm" onclick="go('take-a-loan')">Take a loan</button></div>
    </div>
  </div>
  ${mine.length ? `<div class="stack">${mine.map(loanCard).join("")}</div>`
    : `<div class="card">${emptyBlock("loans", "No loans yet", "Apply for a business or personal loan and track it here.")}</div>`}`;
}

function loanCard(l) {
  const pct = Math.round(((l.principal - l.outstanding) / l.principal) * 100);
  return `
  <div class="card">
    <div class="card-head"><h3>${esc(l.product)}</h3>
      <div class="actions"><span class="pill pill-ok"><span class="led"></span>Up to date</span></div></div>
    <div class="card-pad">
      <div class="grid grid-3 mb16">
        <div><div class="tiny faint">Outstanding</div>
          <div style="font-size:22px;font-weight:600" class="num">${amt(l.outstanding, l.currency)}</div></div>
        <div><div class="tiny faint">Next instalment</div>
          <div style="font-size:22px;font-weight:600" class="num">${amt(l.instalment, l.currency)}</div>
          <div class="tiny muted">due ${shortDate(l.nextDue)}</div></div>
        <div><div class="tiny faint">Rate &middot; term</div>
          <div style="font-size:22px;font-weight:600" class="num">${l.rate}%</div>
          <div class="tiny muted">${l.termMonths} months</div></div>
      </div>
      <div style="height:6px;background:var(--surface-3);border-radius:3px;overflow:hidden;margin-bottom:8px">
        <div style="height:100%;width:${pct}%;background:var(--ok);border-radius:3px"></div></div>
      <div class="row small muted" style="justify-content:space-between">
        <span>${pct}% repaid &middot; ${esc(l.reference)}</span><span>${l.paid} of ${l.termMonths} paid</span></div>
    </div>
    <div class="card-head" style="border-top:1px solid var(--line-2);border-bottom:0">
      <h3 style="font-size:14px">Repayment schedule</h3>
      <div class="actions"><button class="btn btn-ghost btn-sm" onclick="exportModal()">${icon("download", 15)} Export</button></div>
    </div>
    <div class="table-scroll">
      <table class="tbl">
        <thead><tr><th>#</th><th>Due date</th><th class="r">Principal</th><th class="r">Interest</th>
          <th class="r">Instalment</th><th>Status</th></tr></thead>
        <tbody>
        ${LOAN_SCHEDULE.map(s => `<tr>
          <td class="num">${s.n}</td><td>${shortDate(s.due)}</td>
          <td class="r num">${money(s.principal)}</td><td class="r num">${money(s.interest)}</td>
          <td class="r num b">${money(s.total)}</td>
          <td>${s.status === "paid" ? '<span class="pill pill-ok">Paid</span>'
            : s.status === "due" ? '<span class="pill pill-warn">Due</span>'
            : '<span class="pill pill-mute">Upcoming</span>'}</td>
        </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>`;
}

function viewTakeLoan() {
  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="go('loans')">${icon("back", 16)} Loans</button>
    <h1>Take a loan</h1><p class="mono tiny faint">take-a-loan</p>
  </div>
  <div class="flow">
    <div class="card card-pad mb16">
      <div class="field"><label>What is the loan for?</label>
        <div class="radio-cards">
          <button class="radio-card on"><span class="tx-ico">${icon("building", 18)}</span>
            <span><span class="rc-title">Business growth</span><span class="rc-sub">Stock, equipment or expansion</span></span></button>
          <button class="radio-card"><span class="tx-ico">${icon("user", 18)}</span>
            <span><span class="rc-title">Personal</span><span class="rc-sub">School fees, medical, home</span></span></button>
        </div></div>
      <div class="field"><label>How much do you need?</label>
        <div class="amount-field"><span class="cur-tag">ZMW</span>
          <input class="input num" id="ln-amt" value="80,000.00" oninput="calcLoan()"></div></div>
      <div class="field"><label>Over how long?</label>
        <select class="select" id="ln-term" onchange="calcLoan()">
          <option value="12">12 months</option><option value="18">18 months</option>
          <option value="24" selected>24 months</option><option value="36">36 months</option></select></div>
    </div>

    <div class="card card-pad mb16" style="background:var(--surface-2)">
      <div class="row" style="justify-content:space-between;margin-bottom:9px">
        <span class="muted">Estimated monthly instalment</span>
        <span class="b num" id="ln-inst" style="font-size:21px">K4,120.00</span></div>
      <div class="row" style="justify-content:space-between;margin-bottom:9px">
        <span class="muted">Interest rate</span><span class="b num">28.5% p.a.</span></div>
      <div class="row" style="justify-content:space-between">
        <span class="muted">Total repayable</span><span class="b num" id="ln-total">K98,880.00</span></div>
      <div class="tiny faint mt8">Indicative only. Your final rate depends on assessment and security.</div>
    </div>

    <button class="btn btn-cta btn-lg btn-block" onclick="toast('Application started — a loan officer will call you','check')">
      Apply for this loan</button>
    <p class="tiny faint center mt8">A loan officer will call you on ${maskPhone(CUSTOMER.phone)} within one working day.</p>
  </div>`;
}

function calcLoan() {
  const raw = ($("#ln-amt") || {}).value || "0";
  const p = parseFloat(String(raw).replace(/,/g, "")) || 0;
  const n = parseInt(($("#ln-term") || {}).value || "24", 10);
  const r = 0.285 / 12;
  const inst = p > 0 ? (p * r) / (1 - Math.pow(1 + r, -n)) : 0;
  if ($("#ln-inst")) $("#ln-inst").textContent = "K" + money(inst);
  if ($("#ln-total")) $("#ln-total").textContent = "K" + money(inst * n);
}

/* ---------------------------------------------------------------
   14. SCHEDULED / CALENDAR
   --------------------------------------------------------------- */
function viewCalendar() {
  return `
  <div class="page-head">
    <div class="page-head-row">
      <div><h1>Scheduled payments</h1><p>Standing orders and future-dated instructions.</p></div>
      <div class="actions"><button class="btn btn-primary btn-sm" onclick="startScheduleForm()">${icon("plus", 16)} New schedule</button></div>
    </div>
  </div>
  <div class="card">
    <div class="list">
    ${SCHEDULED.map(s => `
      <div class="list-row static">
        <button class="tx-ico" style="border:0;cursor:pointer" onclick="startScheduleForm('${s.id}')"
          aria-label="Edit ${esc(s.name)}">${icon("edit", 18)}</button>
        <span class="tx-body"><span class="tx-desc">${esc(s.name)}</span>
          <span class="tx-meta">${esc(s.beneficiary)} &middot; ${esc(s.frequency)} &middot; next ${shortDate(s.nextRun)}</span></span>
        <span class="tx-amt" style="margin-right:12px"><span class="a num">${amt(s.amount, s.currency)}</span>
          <span class="b">${s.active ? '<span class="pill pill-ok">Active</span>' : '<span class="pill pill-mute">Paused</span>'}</span></span>
        <button class="toggle ${s.active ? "on" : ""}" onclick="toggleSchedule('${s.id}')" aria-label="Toggle ${esc(s.name)}"></button>
      </div>`).join("")}
    </div>
  </div>`;
}

function toggleSchedule(id) {
  const s = SCHEDULED.find(x => x.id === id);
  if (s) { s.active = !s.active; render(); toast(s.name + (s.active ? " resumed" : " paused")); }
}

/* ---------------------------------------------------------------
   15. STATEMENTS
   --------------------------------------------------------------- */
function viewStatements() {
  const months = ["August 2026", "July 2026", "June 2026", "May 2026", "April 2026", "March 2026"];
  return `
  <div class="page-head"><h1>Statements</h1><p>Download or email a statement for any account.</p></div>

  <div class="card card-pad mb16">
    <div class="grid grid-3">
      <div class="field mb0"><label>Account</label>
        <select class="select">${accounts().map(a => `<option>${esc(a.nickname)} — ${esc(a.number)}</option>`).join("")}</select></div>
      <div class="field mb0"><label>Period</label>
        <select class="select"><option>Last 30 days</option><option>Last 3 months</option>
          <option>Last 6 months</option><option>Custom range</option></select></div>
      <div class="field mb0"><label>&nbsp;</label>
        <button class="btn btn-primary btn-block" onclick="exportModal()">${icon("download", 17)} Generate</button></div>
    </div>
    <div class="fee-note mt16">${icon("info", 16)}
      <span>Statements covering the last 30 days are free. Older statements will be charged at K5 per page
      once fees are introduced &mdash; you will see the charge before you confirm.</span></div>
  </div>

  <div class="card">
    <div class="card-head"><h2>Monthly statements</h2></div>
    <div class="list">
    ${months.map((m, i) => `<div class="list-row static">
      <span class="tx-ico">${icon("doc", 18)}</span>
      <span class="tx-body"><span class="tx-desc">${esc(m)}</span>
        <span class="tx-meta">Everyday · 0021447190201 &middot; ${12 + i} pages</span></span>
      <span class="row" style="gap:6px">
        <button class="btn btn-secondary btn-sm" onclick="toast('PDF downloaded','download')">PDF</button>
        <button class="btn btn-secondary btn-sm" onclick="toast('Excel downloaded','download')">Excel</button>
      </span>
    </div>`).join("")}
    </div>
  </div>`;
}

/* ---------------------------------------------------------------
   16. FX
   --------------------------------------------------------------- */
function viewFx() {
  return `
  <div class="page-head">
    <div class="page-head-row">
      <div><h1>Foreign exchange</h1><p>Buy and sell currency at today&rsquo;s rates. <span class="pill pill-new">New</span></p></div>
      <div class="actions"><button class="btn btn-cta btn-sm" onclick="startFlow('fx')">Buy or sell</button></div>
    </div>
  </div>

  <div class="card mb16">
    <div class="card-head"><h2>Today&rsquo;s rates</h2>
      <div class="actions"><span class="tiny faint">Updated 12:00, 6 Sep 2026</span>
        <button class="icon-btn" onclick="toast('Rates refreshed','refresh')" aria-label="Refresh">${icon("refresh", 17)}</button></div></div>
    <div class="table-scroll">
      <table class="tbl">
        <thead><tr><th>Currency pair</th><th class="r">We buy at</th><th class="r">We sell at</th>
          <th class="r">Change</th><th></th></tr></thead>
        <tbody>
        ${FX_RATES.map(r => `<tr>
          <td class="b">${esc(r.pair)}</td>
          <td class="r num">${r.buy.toFixed(4)}</td>
          <td class="r num">${r.sell.toFixed(4)}</td>
          <td class="r num" style="color:${r.change >= 0 ? "var(--ok)" : "var(--err)"}">
            ${r.change >= 0 ? "+" : ""}${r.change.toFixed(2)}</td>
          <td class="r"><button class="btn btn-secondary btn-sm" onclick="startFlow('fx')">Trade</button></td>
        </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>

  <div class="grid grid-2">
    <div class="card card-pad">
      <h3 class="mt0 mb8" style="font-size:15.5px">Your foreign currency</h3>
      ${accounts().filter(a => a.currency !== "ZMW").map(a => `
        <div class="row" style="justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line-2)">
          <span><span class="b">${esc(a.nickname)}</span><br><span class="tiny faint mono">${esc(a.number)}</span></span>
          <span class="b num" style="font-size:18px">${amt(a.balance, a.currency)}</span></div>`).join("")
        || '<p class="muted small">No foreign currency accounts on this profile.</p>'}
      <button class="btn btn-secondary btn-block mt16" onclick="go('products')">Open a currency account</button>
    </div>
    <div class="card card-pad">
      <h3 class="mt0 mb8" style="font-size:15.5px">Sending money abroad?</h3>
      <p class="muted small">International payments are sent by SWIFT and usually arrive in two to three working days.
      Correspondent bank charges may apply and are always shown before you authorise.</p>
      <button class="btn btn-primary btn-block mt16" onclick="startFlow('swift')">Make an international transfer</button>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------
   17. LOCATOR
   --------------------------------------------------------------- */
function viewLocator() {
  const list = LOCATIONS.filter(l => S.locFilter === "all" || l.kind === S.locFilter);
  return `
  <div class="page-head"><h1>Branches &amp; agents</h1>
    <p>Deposit or withdraw at any AB Bank branch, or at a Kazang or 543 Konse Konse agent countrywide.</p></div>

  <div class="row row-wrap mb16" style="gap:10px">
    <div class="seg">
      ${[["all", "All"], ["branch", "Branches"], ["agent", "Agents"]]
        .map(([k, l]) => `<button class="${S.locFilter === k ? "active" : ""}" onclick="S.locFilter='${k}';render()">${l}</button>`).join("")}
    </div>
    <div class="search-wrap">${icon("search", 17)}<input class="input" placeholder="Search by town or name"></div>
  </div>

  <div class="grid grid-2">
  ${list.map(l => `
    <div class="card card-pad">
      <div class="row" style="align-items:flex-start;gap:12px">
        <span class="tx-ico" style="${l.kind === "agent" ? "background:var(--orange-050);color:var(--orange-600)" : ""}">
          ${icon(l.kind === "agent" ? "wallet" : "building", 18)}</span>
        <div style="flex:1;min-width:0">
          <div class="b">${esc(l.name)}</div>
          <div class="small muted">${esc(l.address)}</div>
          <div class="row row-wrap mt8" style="gap:6px">
            <span class="pill pill-mute">${esc(l.town)}</span>
            <span class="pill ${l.kind === "agent" ? "pill-new" : "pill-info"}">${l.kind === "agent" ? esc(l.network) : "Branch"}</span>
          </div>
          <div class="tiny faint mt8">${icon("clock", 13)} ${esc(l.hours)}</div>
        </div>
      </div>
    </div>`).join("")}
  </div>`;
}

/* ---------------------------------------------------------------
   18. SUPPORT
   --------------------------------------------------------------- */
function viewSupport() {
  const faqs = [
    ["How do I get registered for online banking?", "Contact the bank and our team will register you, then send your login details. Call 888 or visit any branch."],
    ["I did not receive my OTP", "Check your network signal, then tap Send again. If it still does not arrive, call 888 — do not share any code with anyone who calls you."],
    ["My transfer has not arrived", "Transfers within AB Bank are instant. Payments to other banks and mobile money usually arrive within minutes. Check the reference on your receipt and call 888 if it is still pending after an hour."],
    ["How much does online banking cost?", "Nothing. Online banking is currently free to use. If charges are introduced, you will always see them before you confirm a payment."],
    ["Someone is asking for my password", "Never share your password, PIN or OTP. AB Bank will never ask for them. Report it to us on 888 immediately."],
  ];
  return `
  <div class="page-head"><h1>Support</h1><p>We aim to solve any problem within 10 minutes.</p></div>

  <div class="grid grid-3 mb24">
    <button class="card card-pad" style="text-align:left;cursor:pointer" onclick="toast('Calling 888…','support')">
      <span class="tx-ico" style="background:var(--blue-050);color:var(--blue)">${icon("support", 18)}</span>
      <div class="b mt8">Call us on 888</div><div class="small muted">Free from any Zambian network, 24/7</div></button>
    <button class="card card-pad" style="text-align:left;cursor:pointer" onclick="toast('Chat would open')">
      <span class="tx-ico" style="background:var(--ok-050);color:var(--ok)">${icon("chat", 18)}</span>
      <div class="b mt8">Chat with us</div><div class="small muted">Typically replies in a few minutes</div></button>
    <button class="card card-pad" style="text-align:left;cursor:pointer" onclick="go('locator')">
      <span class="tx-ico" style="background:var(--orange-050);color:var(--orange-600)">${icon("locator", 18)}</span>
      <div class="b mt8">Visit a branch</div><div class="small muted">Find your nearest branch or agent</div></button>
  </div>

  <div class="banner banner-warn mb16">
    <span class="b-ico">${icon("warn", 19)}</span>
    <div class="b-body"><b>Report fraud immediately</b>
      <p>If you think someone has accessed your account, call <b>888</b> straight away. We will freeze the account while we investigate.</p></div>
    <button class="btn btn-danger btn-sm" onclick="go('report-fraud')">Report fraud</button>
  </div>

  <div class="card">
    <div class="card-head"><h2>Common questions</h2></div>
    <div class="list">
    ${faqs.map((f, i) => `
      <div class="list-row static" style="display:block;padding:0">
        <button style="width:100%;text-align:left;background:none;border:0;padding:14px 20px;cursor:pointer"
          onclick="toggleFaq(${i})">
          <span class="row"><span class="b" style="flex:1">${esc(f[0])}</span>
          <span class="faint" id="fa-i-${i}">${icon("chevronDown", 17)}</span></span>
        </button>
        <div id="fa-${i}" style="display:none;padding:0 20px 15px;color:var(--ink-3);font-size:14px">${esc(f[1])}</div>
      </div>`).join("")}
    </div>
  </div>

  <p class="tiny faint mt16">Not satisfied with how a complaint was handled? You may refer it to the Bank of Zambia
  in line with the Customer Complaints Handling Directive.</p>`;
}

function toggleFaq(i) {
  const el = document.getElementById("fa-" + i);
  if (el) el.style.display = el.style.display === "none" ? "block" : "none";
}

/* ---------------------------------------------------------------
   19. SETTINGS
   --------------------------------------------------------------- */
function viewSettings() {
  const rows = [
    ["Sign-in", [
      ["Biometric sign-in", "Use your fingerprint instead of a password", true, "new"],
      ["Remember this device", "Skip extra checks on this device", true],
      ["Change password", "Last changed 3 months ago", null, null, "change-password"],
    ]],
    ["Notifications", [
      ["Transaction alerts", "SMS and in-app for every transaction", true],
      ["Approval requests", "When someone raises a payment for you", true],
      ["Marketing", "Product news and offers", false],
    ]],
    ["Preferences", [
      ["Language", "English", null, null, "language"],
      ["Low-data mode", "Use less data on slow connections", false, "new"],
      ["Hide balances by default", "Balances stay hidden until you tap", false],
    ]],
  ];
  return `
  <div class="page-head"><h1>Settings</h1><p>Your profile, security and preferences.</p></div>

  <div class="card card-pad mb16">
    <div class="row" style="gap:14px">
      <span class="avatar" style="width:52px;height:52px;font-size:18px">${esc(CUSTOMER.initials)}</span>
      <div style="flex:1;min-width:0">
        <div class="b" style="font-size:17px">${esc(CUSTOMER.name)}</div>
        <div class="small muted">${esc(CUSTOMER.phone)} &middot; ${esc(CUSTOMER.email)}</div>
        <div class="tiny faint mt8">Customer number <span class="mono">${esc(CUSTOMER.id)}</span></div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="go('edit-profile')">Edit</button>
    </div>
  </div>

  ${rows.map(([title, items]) => `
    <div class="card mb16">
      <div class="card-head"><h2>${esc(title)}</h2></div>
      <div class="list">
      ${items.map(([label, sub, on, tag, route]) => `
        <${route ? "button" : "div"} class="list-row ${route ? "" : "static"}"
          ${route ? `onclick="go('${route}')" style="background:none;border:0;width:100%;text-align:left"` : ""}>
          <span class="tx-body"><span class="tx-desc">${esc(label)}
            ${tag === "new" ? '<span class="pill pill-new" style="margin-left:6px">New</span>' : ""}</span>
            <span class="tx-meta">${esc(sub)}</span></span>
          ${on === null
            ? '<span class="faint">' + icon("chevron", 16) + "</span>"
            : '<button class="toggle ' + (on ? "on" : "") + '" onclick="this.classList.toggle(\'on\')" aria-label="' + esc(label) + '"></button>'}
        </${route ? "button" : "div"}>`).join("")}
      </div>
    </div>`).join("")}

  <div class="card mb16">
    <div class="card-head"><h2>Security</h2></div>
    <div class="list">
      <div class="list-row static"><span class="tx-ico">${icon("shield", 18)}</span>
        <span class="tx-body"><span class="tx-desc">Last sign-in</span>
          <span class="tx-meta">${shortDate(CUSTOMER.lastLogin)} at ${timeLabel(CUSTOMER.lastLogin)} &middot; Android &middot; Lusaka</span></span></div>
      <button class="list-row" onclick="go('devices')"><span class="tx-ico">${icon("phone", 18)}</span>
        <span class="tx-body"><span class="tx-desc">Registered devices</span>
          <span class="tx-meta">2 devices</span></span>${icon("chevron", 16)}</button>
    </div>
  </div>

  <div class="card mb16">
    <div class="card-head"><h2>Legal</h2></div>
    <div class="list">
      <button class="list-row" onclick="go('terms-of-use')">
        <span class="tx-ico">${icon("doc", 18)}</span>
        <span class="tx-body"><span class="tx-desc">Terms of use</span>
          <span class="tx-meta">In force from 1 September 2026</span></span>${icon("chevron", 16)}</button>
      <button class="list-row" onclick="go('products')">
        <span class="tx-ico">${icon("grid", 18)}</span>
        <span class="tx-body"><span class="tx-desc">Products &amp; services</span>
          <span class="tx-meta">Accounts, loans and eTumba</span></span>${icon("chevron", 16)}</button>
    </div>
  </div>

  <button class="btn btn-secondary btn-block" onclick="signOut()">${icon("logout", 18)} Sign out</button>`;
}

/* ---------------------------------------------------------------
   20. NOTIFICATIONS
   --------------------------------------------------------------- */
function viewNotifications() {
  const kindIcon = { transaction: "transfer", approval: "approvals", security: "shield" };
  return `
  <div class="page-head">
    <div class="page-head-row">
      <div><h1>Notifications</h1><p>Everything that happened on your accounts.</p></div>
      <div class="actions"><button class="btn btn-secondary btn-sm"
        onclick="NOTIFICATIONS.forEach(n=>n.unread=false);render();toast('All marked as read')">Mark all read</button></div>
    </div>
  </div>
  <div class="card"><div class="list">
  ${NOTIFICATIONS.map(n => `
    <div class="list-row static" style="${n.unread ? "background:var(--blue-050)" : ""}">
      <span class="tx-ico">${icon(kindIcon[n.kind] || "bell", 17)}</span>
      <span class="tx-body"><span class="tx-desc">${esc(n.title)}</span>
        <span class="tx-meta">${esc(n.body)}</span></span>
      <span class="tx-amt"><span class="b tiny faint">${dateLabel(n.at)}</span>
        <span class="b tiny faint">${timeLabel(n.at)}</span></span>
    </div>`).join("")}
  </div></div>`;
}

/* ---------------------------------------------------------------
   21. ROUTER + RENDER
   --------------------------------------------------------------- */
const ROUTES = {
  dashboard: viewDashboard,
  accounts: viewAccounts,
  account: viewAccount,
  transactions: viewTransactions,
  transfer: viewTransfer,
  flow: viewFlow,
  approvals: viewApprovals,
  templates: viewTemplates,
  loans: viewLoans,
  loan: viewLoans,
  "take-a-loan": viewTakeLoan,
  calendar: viewCalendar,
  statements: viewStatements,
  fx: viewFx,
  locator: viewLocator,
  support: viewSupport,
  settings: viewSettings,
  notifications: viewNotifications,
  "templates/add": viewTemplateForm,
  "templates/edit": viewTemplateForm,
  "calendar/add": viewScheduleForm,
  "calendar/edit": viewScheduleForm,
  "terms-of-use": viewTerms,
  products: viewProducts,
  "change-password": viewChangePassword,
  devices: viewDevices,
  "edit-profile": viewEditProfile,
  language: viewLanguage,
  "report-fraud": viewReportFraud,
};

/* airtime and utility open the flow directly */
function routeInner() {
  if (S.route === "airtime") { startFlowSilently("airtime"); return viewFlow(); }
  if (S.route === "utility") { startFlowSilently("utility"); return viewFlow(); }
  const fn = ROUTES[S.route];
  return fn ? fn() : viewDashboard();
}

function startFlowSilently(kind) {
  if (!S.flow || S.flow.kind !== kind || S.flow.step === "done") {
    S.flow = {
      kind, step: "form", nav: FLOW_DEF[kind].nav,
      from: accounts()[0].id, to: "", amount: "", ref: "",
      bank: "ZNCBK", biller: "zesco", bundleKind: "airtime", bundle: null,
      phone: "", saveTemplate: false, fxDir: "buy", fxPair: "USD/ZMW",
    };
  }
}

function render() {
  const root = $("#root");
  if (!S.signedIn) {
    // Reachable before sign-in: password reset and the terms of use.
    if (S.route === "reset-password") { root.innerHTML = viewResetPassword(); return; }
    if (S.route === "terms-of-use") { root.innerHTML = viewTerms(); return; }
    root.innerHTML = viewAuth();
    return;
  }
  if (S.route === "activate") { root.innerHTML = viewActivate(); return; }
  root.innerHTML = shell(routeInner());
}

/* boot */
render();
