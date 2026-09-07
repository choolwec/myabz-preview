/* =============================================================
   MyABZ prototype — additional pages
   -------------------------------------------------------------
   Screens reached from a link or button elsewhere in the app.
   Kept in their own file so app.js stays the shell + main flows.

   Loaded BEFORE app.js: these are function declarations, so the
   route table in app.js can reference them directly.
   ============================================================= */

/* ---------------------------------------------------------------
   TEMPLATES — add / edit a saved beneficiary
   --------------------------------------------------------------- */
let TPL = null;

function startTemplateForm(id) {
  const existing = id ? TEMPLATES.find(t => t.id === id) : null;
  TPL = existing
    ? { ...existing, editing: true }
    : { id: null, editing: false, type: "bank", name: "", bank: "ZNCBK", mno: "", accountNumber: "" };
  go(existing ? "templates/edit" : "templates/add");
}

function tplSet(k, v) { TPL[k] = v; render(); }

function viewTemplateForm() {
  if (!TPL) return viewTemplates();
  const t = TPL;
  const resolved = lookupName(t.accountNumber);
  const m = t.type === "mobile" ? mnoFor(t.accountNumber) : null;
  const valid = t.name.trim().length > 1 &&
    (t.type === "mobile" ? !!m : t.accountNumber.length > 5);

  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="go('templates')">${icon("back", 16)} Templates</button>
    <h1>${t.editing ? "Edit template" : "Add new template"}</h1>
    <p class="mono tiny faint">${t.editing ? "templates/edit-account-template" : "templates/add"}</p>
  </div>

  <div class="flow">
    <div class="card card-pad mb16">
      <div class="field">
        <label>What kind of beneficiary?</label>
        <div class="seg">
          <button class="${t.type === "bank" ? "active" : ""}" onclick="tplSet('type','bank')">Bank account</button>
          <button class="${t.type === "mobile" ? "active" : ""}" onclick="tplSet('type','mobile')">Mobile money</button>
        </div>
      </div>

      <div class="field">
        <label>Name for this template</label>
        <input class="input" maxlength="40" placeholder="e.g. Kabwe Hardware Ltd"
          value="${esc(t.name)}" oninput="TPL.name=this.value">
        <div class="hint">Only you see this name. It makes the beneficiary easy to find later.</div>
      </div>

      ${t.type === "bank" ? `
        <div class="field">
          <label>Bank</label>
          <select class="select" onchange="tplSet('bank',this.value)">
            ${BANKS.map(b => `<option value="${b.code}" ${b.code === t.bank ? "selected" : ""}>${esc(b.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>Account number</label>
          <input class="input mono" inputmode="numeric" placeholder="0100224419"
            value="${esc(t.accountNumber)}" oninput="tplSet('accountNumber',this.value)">
        </div>
      ` : `
        <div class="field">
          <label>Mobile number</label>
          <div class="input-wrap">
            <input class="input" inputmode="tel" maxlength="13" placeholder="097 123 4567"
              value="${esc(t.accountNumber)}" oninput="tplSet('accountNumber',this.value)" style="padding-right:110px">
            <div class="trail">${m ? mnoChip(m) : ""}</div>
          </div>
          <div class="hint">${m ? "" : "Airtel, MTN or Zamtel."}</div>
        </div>
      `}

      ${resolved ? `
        <div class="banner banner-ok">
          <span class="b-ico">${icon("check", 18)}</span>
          <div class="b-body"><b>${esc(resolved)}</b><p>Confirmed with the receiving institution.</p></div>
        </div>`
      : t.accountNumber.length > 8 ? `
        <div class="banner banner-warn">
          <span class="b-ico">${icon("warn", 18)}</span>
          <div class="b-body"><b>We couldn&rsquo;t confirm this name</b>
          <p>Check the number carefully. You can still save it.</p></div>
        </div>` : ""}
    </div>

    <div class="row" style="gap:9px">
      ${t.editing ? `<button class="btn btn-danger" onclick="deleteTemplate('${esc(t.id)}')">${icon("trash", 17)} Delete</button>` : ""}
      <button class="btn btn-secondary" style="flex:1" onclick="go('templates')">Cancel</button>
      <button class="btn btn-primary" style="flex:2" ${valid ? "" : "disabled"} onclick="saveTemplate()">
        ${t.editing ? "Save changes" : "Save template"}
      </button>
    </div>
  </div>`;
}

function saveTemplate() {
  const t = TPL;
  if (t.editing) {
    const i = TEMPLATES.findIndex(x => x.id === t.id);
    if (i >= 0) TEMPLATES[i] = { ...TEMPLATES[i], name: t.name, type: t.type, bank: t.bank, accountNumber: t.accountNumber };
    toast("Template updated", "check");
  } else {
    TEMPLATES.unshift({
      id: "TP-" + Math.random().toString(36).slice(2, 7),
      name: t.name, type: t.type,
      bank: t.type === "bank" ? t.bank : undefined,
      mno: t.type === "mobile" ? (mnoFor(t.accountNumber) || {}).id : undefined,
      accountNumber: t.accountNumber, lastUsed: "2026-09-07", uses: 0,
    });
    toast("Template saved", "check");
  }
  TPL = null;
  go("templates");
}

function deleteTemplate(id) {
  const i = TEMPLATES.findIndex(x => x.id === id);
  if (i >= 0) TEMPLATES.splice(i, 1);
  TPL = null;
  go("templates");
  toast("Template deleted");
}

/* ---------------------------------------------------------------
   SCHEDULED PAYMENTS — add / edit a standing order
   --------------------------------------------------------------- */
let SCH = null;

function startScheduleForm(id) {
  const existing = id ? SCHEDULED.find(s => s.id === id) : null;
  SCH = existing
    ? { ...existing, editing: true }
    : {
        id: null, editing: false, name: "", type: "bank", beneficiary: "",
        amount: "", currency: "ZMW", frequency: "Monthly",
        nextRun: "2026-10-01", accountId: accounts()[0].id, active: true,
      };
  go(existing ? "calendar/edit" : "calendar/add");
}

function schSet(k, v) { SCH[k] = v; render(); }

function viewScheduleForm() {
  if (!SCH) return viewCalendar();
  const s = SCH;
  const valid = s.name.trim().length > 1 && parseFloat(s.amount) > 0 && s.beneficiary.trim().length > 1;

  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="go('calendar')">${icon("back", 16)} Scheduled payments</button>
    <h1>${s.editing ? "Edit schedule" : "New scheduled payment"}</h1>
    <p class="mono tiny faint">${s.editing ? "calendar/edit-event" : "calendar/add-event"}</p>
  </div>

  <div class="flow">
    <div class="card card-pad mb16">
      <div class="field">
        <label>What is this for?</label>
        <input class="input" maxlength="40" placeholder="e.g. Rent — Kabulonga"
          value="${esc(s.name)}" oninput="SCH.name=this.value">
      </div>

      <div class="field">
        <label>Pay from</label>
        <select class="select" onchange="schSet('accountId',this.value)">
          ${accounts().map(a => `<option value="${a.id}" ${a.id === s.accountId ? "selected" : ""}>
            ${esc(a.nickname)} — ${esc(a.currency)} ${money(a.available)} available</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>Pay to</label>
        <select class="select" onchange="schSet('beneficiary',this.value)">
          <option value="">Choose a saved template…</option>
          ${TEMPLATES.map(t => `<option value="${esc(t.name)}" ${t.name === s.beneficiary ? "selected" : ""}>
            ${esc(t.name)}</option>`).join("")}
        </select>
        <div class="hint">
          Not saved yet? <a href="#" onclick="event.preventDefault();startTemplateForm()">Add a template first</a>.
        </div>
      </div>

      <div class="field">
        <label>Amount</label>
        <div class="amount-field">
          <span class="cur-tag">ZMW</span>
          <input class="input num" inputmode="decimal" placeholder="0.00"
            value="${esc(s.amount)}" oninput="SCH.amount=this.value">
        </div>
      </div>

      <div class="field">
        <label>How often?</label>
        <select class="select" onchange="schSet('frequency',this.value)">
          ${["Weekly", "Monthly", "Quarterly", "Annually", "Once"].map(f =>
            `<option ${f === s.frequency ? "selected" : ""}>${f}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>First payment date</label>
        <input class="input" type="date" value="${esc(s.nextRun)}" onchange="schSet('nextRun',this.value)">
      </div>

      <div class="fee-note">${icon("info", 16)}
        <span>Scheduled payments run at 06:00 on the due date. If the account is short,
        we retry once the next morning and tell you either way.</span></div>
    </div>

    <div class="row" style="gap:9px">
      ${s.editing ? `<button class="btn btn-danger" onclick="deleteSchedule('${esc(s.id)}')">${icon("trash", 17)} Delete</button>` : ""}
      <button class="btn btn-secondary" style="flex:1" onclick="go('calendar')">Cancel</button>
      <button class="btn btn-primary" style="flex:2" ${valid ? "" : "disabled"} onclick="saveSchedule()">
        ${s.editing ? "Save changes" : "Create schedule"}
      </button>
    </div>
  </div>`;
}

function saveSchedule() {
  const s = SCH;
  const amount = parseFloat(s.amount) || 0;
  if (s.editing) {
    const i = SCHEDULED.findIndex(x => x.id === s.id);
    if (i >= 0) SCHEDULED[i] = { ...SCHEDULED[i], name: s.name, beneficiary: s.beneficiary, amount, frequency: s.frequency, nextRun: s.nextRun };
    toast("Schedule updated", "check");
  } else {
    SCHEDULED.push({
      id: "SC-" + Math.random().toString(36).slice(2, 7),
      name: s.name, type: "bank", beneficiary: s.beneficiary, amount,
      currency: "ZMW", frequency: s.frequency, nextRun: s.nextRun,
      accountId: s.accountId, active: true,
    });
    toast("Schedule created", "check");
  }
  SCH = null;
  go("calendar");
}

function deleteSchedule(id) {
  const i = SCHEDULED.findIndex(x => x.id === id);
  if (i >= 0) SCHEDULED.splice(i, 1);
  SCH = null;
  go("calendar");
  toast("Schedule deleted");
}

/* ---------------------------------------------------------------
   RESET PASSWORD  (pre-login)
   --------------------------------------------------------------- */
let RESET_STEP = 1;

function viewResetPassword() {
  return `
  <div class="auth-wrap">
    <div class="auth-brand">
      <div class="logo"><img class="lg" src="assets/logo-white.png" alt="AB Bank"></div>
      <div>
        <h2>We&rsquo;ll get you back in.</h2>
        <p>Confirm a few details and we&rsquo;ll send a reset code to the number registered on your account.</p>
      </div>
      <div class="values"><span>Simple</span><span>Responsive</span><span>Reliable</span></div>
    </div>

    <div class="auth-panel">
      <div class="auth-card">
        <div class="auth-mobile-logo"><div class="logo"><img src="assets/logo.png" alt="AB Bank"></div></div>
        <button class="btn btn-ghost btn-sm mb16" style="padding-left:0" onclick="RESET_STEP=1;go('auth')">
          ${icon("back", 16)} Back to sign in</button>

        ${RESET_STEP === 1 ? `
          <h1>Reset your password</h1>
          <p class="sub">Enter your username and the mobile number on your account.</p>
          <div class="field"><label>Username</label>
            <input class="input" placeholder="Your MyABZ username"></div>
          <div class="field"><label>Mobile number</label>
            <input class="input" inputmode="tel" placeholder="097 123 4567"></div>
          <button class="btn btn-primary btn-lg btn-block" onclick="RESET_STEP=2;render()">Send reset code</button>
        ` : RESET_STEP === 2 ? `
          <h1>Enter the code</h1>
          <p class="sub">We sent a 6-digit code to ${maskPhone(CUSTOMER.phone)}.</p>
          <div class="otp-row">
            ${[0,1,2,3,4,5].map(i => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i+1}" oninput="otpAdvance(this,${i})">`).join("")}
          </div>
          <p class="tiny faint center mt8 mb16">Didn&rsquo;t get it?
            <a href="#" onclick="event.preventDefault();toast('New code sent')">Send again</a></p>
          <button class="btn btn-primary btn-lg btn-block" onclick="RESET_STEP=3;render()">Continue</button>
        ` : `
          <h1>Choose a new password</h1>
          <p class="sub">Make it something only you know.</p>
          <div class="field"><label>New password</label>
            <input class="input" type="password" placeholder="At least 8 characters">
            <div class="hint">8 or more characters with a mix of letters, numbers and symbols.</div></div>
          <div class="field"><label>Confirm new password</label>
            <input class="input" type="password" placeholder="Type it again"></div>
          <button class="btn btn-primary btn-lg btn-block"
            onclick="RESET_STEP=1;go('auth');toast('Password reset — sign in with your new password','check')">
            Reset password</button>
        `}

        <div class="banner banner-warn mt24" style="font-size:13px">
          <span class="b-ico">${icon("shield", 17)}</span>
          <div class="b-body"><p>AB Bank will never call or message you asking for a reset code.
          If someone does, hang up and call <b>888</b>.</p></div>
        </div>

        <div class="auth-foot">Need help? Call <b>888</b></div>
      </div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------
   TERMS OF USE  (production route: terms-of-use)
   --------------------------------------------------------------- */
const TERMS = [
  ["Agreement and Acceptance",
   "By using MyABZ you agree to these terms. They apply alongside the terms of the account or facility you hold with AB Bank Zambia Limited."],
  ["Capacity to enter into agreements",
   "You confirm you have the legal capacity to enter into this agreement, and that instructions given through MyABZ are given with proper authority. Where you act for a business, you confirm you are authorised under that mandate."],
  ["Defining the device and medium",
   "MyABZ may be accessed from any device with a supported browser and an internet connection. You are responsible for the security of the device you use."],
  ["Access code protection and irregularities",
   "You must keep your username, password and one-time codes confidential. AB Bank will never ask you for them. Report any irregularity on your account to 888 immediately."],
  ["Confirmation of receipt of your instructions",
   "An instruction is only received once we confirm it on screen with a reference number. A payment shown as pending has not yet settled."],
  ["Fees for the use of Online Banking",
   "Online banking is currently provided at no charge. Should fees be introduced, the applicable charge will be disclosed to you before you authorise a transaction, and published in the tariff guide."],
  ["Amendments",
   "We may amend these terms. Material changes will be notified to you through the platform or by SMS before they take effect."],
  ["Disclaimer and limitation of liability",
   "AB Bank is not liable for loss arising from your failure to keep credentials secure, or from interruptions outside our reasonable control, including network or power failure."],
  ["Breach",
   "We may suspend access where we reasonably suspect a breach of these terms or unauthorised use of your account."],
  ["Ending a session",
   "Always sign out when you finish. Sessions time out automatically after a period of inactivity."],
  ["Transmission of information and security tips",
   "Information is encrypted in transit. Do not access MyABZ over public Wi-Fi you do not trust, and keep your device software up to date."],
];

function viewTerms() {
  const signedIn = S.signedIn;
  const body = `
    <div class="page-head">
      ${signedIn ? `<button class="btn btn-ghost btn-sm mb8" onclick="go('settings')">${icon("back", 16)} Settings</button>` : ""}
      <h1>Terms of use</h1>
      <p class="mono tiny faint">terms-of-use</p>
    </div>
    <div class="flow">
      <div class="banner banner-info mb16">
        <span class="b-ico">${icon("info", 18)}</span>
        <div class="b-body"><b>In force from 1 September 2026</b>
          <p>These terms govern your use of MyABZ online banking.</p></div>
      </div>
      <div class="card">
        ${TERMS.map((t, i) => `
          <div style="padding:16px 20px;border-bottom:1px solid var(--line-2)">
            <div class="b mb8">${i + 1}. ${esc(t[0])}</div>
            <p class="small muted mb0">${esc(t[1])}</p>
          </div>`).join("")}
      </div>
      <p class="tiny faint mt16">
        Complaints may be raised on 888 or at any branch. If you are not satisfied with the outcome
        you may refer the matter to the Bank of Zambia under the Customer Complaints Handling Directive.
      </p>
      ${signedIn ? "" : `<button class="btn btn-primary btn-block mt16" onclick="go('auth')">Back to sign in</button>`}
    </div>`;

  return signedIn ? body : `<div class="app on"><div class="main" style="margin-left:0;padding-bottom:0">
    <header class="topbar"><div class="mobile-logo" style="display:flex">
      <div class="logo"><img src="assets/logo.png" alt="AB Bank"></div></div></header>
    <main class="page">${body}</main></div></div>`;
}

/* ---------------------------------------------------------------
   PRODUCTS  (production route: products/:type/:id)
   --------------------------------------------------------------- */
const PRODUCTS = [
  { id: "tamanga", cat: "Accounts", name: "Tamanga Current Account", tag: "Individual",
    blurb: "Everyday banking with free SMS alerts, e-wallet services and standing orders.",
    points: ["K20 monthly maintenance", "Free cash deposits and withdrawals", "Free internal transfers"] },
  { id: "tamanga-plus", cat: "Accounts", name: "Tamanga Plus", tag: "Individual premium",
    blurb: "Premium current account with a cheque book, free national transfers and a Premium Pass.",
    points: ["K75 monthly maintenance", "Free national transfers", "Skip the queue with Premium Pass"] },
  { id: "mukula-plus", cat: "Accounts", name: "Mukula Plus", tag: "Corporate premium",
    blurb: "Premium corporate current account with payment approvals and multi-user access.",
    points: ["Maker-checker approvals", "Cheque book included", "Premium Pass"] },
  { id: "savings", cat: "Accounts", name: "Savings Account", tag: "Individual",
    blurb: "Put money aside and earn interest, with instant access when you need it.",
    points: ["6.5% p.a. interest", "No monthly fee", "Transfer instantly from your current account"] },
  { id: "fcy", cat: "Accounts", name: "Foreign Currency Account", tag: "USD · EUR",
    blurb: "Hold and transact in US dollars or euros alongside your kwacha accounts.",
    points: ["Receive inward SWIFT payments", "Buy and sell currency online", "No monthly fee"] },
  { id: "business-loan", cat: "Lending", name: "Business Growth Loan", tag: "MSME",
    blurb: "Working capital and asset finance for small and growing businesses.",
    points: ["From 28.5% p.a.", "Terms of 12 to 36 months", "Decision within one working day"] },
  { id: "personal-loan", cat: "Lending", name: "Personal Loan", tag: "Individual",
    blurb: "For school fees, medical costs or anything else that will not wait.",
    points: ["From 32% p.a.", "Terms up to 12 months", "Repay directly from your account"] },
  { id: "etumba", cat: "Digital", name: "eTumba Wallet", tag: "Mobile wallet",
    blurb: "AB Bank's mobile wallet — send, receive and pay from your phone, with cash in and out at agents countrywide.",
    points: ["Dial *888#", "Cash in/out at Kazang and 543 Konse Konse", "Yaka Savings at 10% p.a."] },
];

function viewProducts() {
  const cats = ["Accounts", "Lending", "Digital"];
  return `
  <div class="page-head">
    <h1>Products &amp; services</h1>
    <p>Everything AB Bank offers. Ask about any of these on 888 or at a branch.</p>
    <p class="mono tiny faint">products/:type/:id</p>
  </div>
  ${cats.map(cat => `
    <div class="mb24">
      <div class="nav-label" style="color:var(--ink-3);padding-left:0">${esc(cat)}</div>
      <div class="grid grid-2">
        ${PRODUCTS.filter(p => p.cat === cat).map(p => `
          <div class="card card-pad">
            <div class="row" style="justify-content:space-between;align-items:flex-start;gap:10px">
              <div class="b" style="font-size:16px">${esc(p.name)}</div>
              <span class="pill pill-mute">${esc(p.tag)}</span>
            </div>
            <p class="small muted mt8 mb8">${esc(p.blurb)}</p>
            <ul style="margin:0 0 14px;padding-left:18px" class="small muted">
              ${p.points.map(x => `<li style="margin-bottom:3px">${esc(x)}</li>`).join("")}
            </ul>
            <button class="btn btn-secondary btn-sm btn-block"
              onclick="toast('A relationship officer will call you about ${esc(p.name)}','check')">
              Ask about this</button>
          </div>`).join("")}
      </div>
    </div>`).join("")}`;
}

/* ---------------------------------------------------------------
   SETTINGS SUB-PAGES
   --------------------------------------------------------------- */
function viewChangePassword() {
  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="go('settings')">${icon("back", 16)} Settings</button>
    <h1>Change password</h1>
  </div>
  <div class="flow">
    <div class="card card-pad mb16">
      <div class="field"><label>Current password</label>
        <input class="input" type="password" placeholder="Your current password"></div>
      <div class="field"><label>New password</label>
        <input class="input" type="password" placeholder="At least 8 characters">
        <div class="hint">8 or more characters with a mix of letters, numbers and symbols.</div></div>
      <div class="field"><label>Confirm new password</label>
        <input class="input" type="password" placeholder="Type it again"></div>
    </div>
    <div class="banner banner-warn mb16">
      <span class="b-ico">${icon("shield", 18)}</span>
      <div class="b-body"><b>Never share your password</b>
        <p>AB Bank will never ask for it — not by phone, SMS or email.</p></div>
    </div>
    <button class="btn btn-primary btn-lg btn-block"
      onclick="go('settings');toast('Password changed','check')">Change password</button>
  </div>`;
}

const DEVICES = [
  { id: "D1", name: "Samsung Galaxy A14", detail: "Android 14 · Lusaka", last: "Today, 12:04", current: true },
  { id: "D2", name: "Windows PC — Chrome", detail: "Windows 11 · Lusaka", last: "5 Sep 2026, 18:42", current: false },
];

function viewDevices() {
  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="go('settings')">${icon("back", 16)} Settings</button>
    <h1>Registered devices</h1>
    <p>Devices that have signed in to your account.</p>
  </div>
  <div class="flow">
    <div class="card mb16">
      <div class="list">
      ${DEVICES.map(d => `
        <div class="list-row static">
          <span class="tx-ico">${icon(d.name.includes("PC") ? "accounts" : "phone", 18)}</span>
          <span class="tx-body">
            <span class="tx-desc">${esc(d.name)} ${d.current ? '<span class="pill pill-ok" style="margin-left:6px">This device</span>' : ""}</span>
            <span class="tx-meta">${esc(d.detail)} &middot; last used ${esc(d.last)}</span>
          </span>
          ${d.current ? "" : `<button class="btn btn-danger btn-sm" onclick="removeDevice('${d.id}')">Remove</button>`}
        </div>`).join("")}
      </div>
    </div>
    <div class="banner banner-info">
      <span class="b-ico">${icon("info", 18)}</span>
      <div class="b-body"><b>See a device you don&rsquo;t recognise?</b>
        <p>Remove it, change your password, then call <b>888</b>.</p></div>
    </div>
  </div>`;
}

function removeDevice(id) {
  const i = DEVICES.findIndex(d => d.id === id);
  if (i >= 0) DEVICES.splice(i, 1);
  render();
  toast("Device removed — it will need to sign in again");
}

function viewEditProfile() {
  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="go('settings')">${icon("back", 16)} Settings</button>
    <h1>Personal details</h1>
  </div>
  <div class="flow">
    <div class="card card-pad mb16">
      <div class="field"><label>Full name</label>
        <input class="input" value="${esc(CUSTOMER.name)}" disabled style="background:var(--surface-2)">
        <div class="hint">Your name is held on your account record. To change it, visit a branch with your NRC.</div></div>
      <div class="field"><label>Mobile number</label>
        <input class="input" value="${esc(CUSTOMER.phone)}">
        <div class="hint">Used for one-time codes and transaction alerts.</div></div>
      <div class="field"><label>Email address <span class="faint" style="font-weight:400">(optional)</span></label>
        <input class="input" value="${esc(CUSTOMER.email)}" placeholder="Not provided">
        <div class="hint">We&rsquo;ll send statements here if you add one.</div></div>
      <div class="field"><label>Postal address</label>
        <textarea class="input" rows="3">P.O. Box 30001, Lusaka</textarea></div>
    </div>
    <div class="banner banner-info mb16">
      <span class="b-ico">${icon("shield", 18)}</span>
      <div class="b-body"><b>Changing your mobile number needs verification</b>
        <p>We&rsquo;ll send a code to both the old and the new number before the change takes effect.</p></div>
    </div>
    <button class="btn btn-primary btn-lg btn-block"
      onclick="go('settings');toast('Details updated','check')">Save changes</button>
  </div>`;
}

const LANGUAGES = [
  { code: "en", name: "English", native: "English", ready: true },
  { code: "ny", name: "Nyanja", native: "Chinyanja", ready: false },
  { code: "bem", name: "Bemba", native: "Ichibemba", ready: false },
  { code: "toi", name: "Tonga", native: "Chitonga", ready: false },
];

function viewLanguage() {
  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="go('settings')">${icon("back", 16)} Settings</button>
    <h1>Language</h1>
    <p>Choose the language you want to bank in.</p>
  </div>
  <div class="flow">
    <div class="radio-cards mb16">
      ${LANGUAGES.map(l => `
        <button class="radio-card ${l.code === "en" ? "on" : ""}" ${l.ready ? "" : 'style="opacity:.65"'}
          onclick="${l.ready ? "toast('Language set to " + esc(l.name) + "','check')" : "toast('" + esc(l.name) + " is coming soon')"}">
          <span><span class="rc-title">${esc(l.native)}</span>
          <span class="rc-sub">${esc(l.name)}</span></span>
          <span class="rc-right">${l.ready
            ? (l.code === "en" ? icon("check", 18) : "")
            : '<span class="pill pill-mute">Coming soon</span>'}</span>
        </button>`).join("")}
    </div>
    <div class="banner banner-info">
      <span class="b-ico">${icon("info", 18)}</span>
      <div class="b-body"><b>Local languages are on the way</b>
        <p>No bank in Zambia offers online banking in Nyanja or Bemba yet. We&rsquo;re building it.</p></div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------
   REPORT FRAUD  (must reach a human — BoZ complaints directive)
   --------------------------------------------------------------- */
function viewReportFraud() {
  return `
  <div class="page-head">
    <button class="btn btn-ghost btn-sm mb8" onclick="go('support')">${icon("back", 16)} Support</button>
    <h1>Report fraud</h1>
    <p>Tell us what happened. We&rsquo;ll act on it straight away.</p>
  </div>

  <div class="flow">
    <div class="banner banner-warn mb16">
      <span class="b-ico">${icon("warn", 19)}</span>
      <div class="b-body"><b>If money is leaving your account right now, call 888</b>
        <p>A phone call is faster than this form. We can freeze the account while we investigate.</p></div>
      <button class="btn btn-danger btn-sm" onclick="toast('Calling 888…','support')">Call 888</button>
    </div>

    <div class="card card-pad mb16">
      <div class="field">
        <label>What happened?</label>
        <div class="radio-cards">
          <button class="radio-card on"><span><span class="rc-title">I don&rsquo;t recognise a transaction</span>
            <span class="rc-sub">Money left my account and I didn&rsquo;t authorise it</span></span></button>
          <button class="radio-card"><span><span class="rc-title">Someone asked for my password or OTP</span>
            <span class="rc-sub">A call, SMS or message pretending to be the bank</span></span></button>
          <button class="radio-card"><span><span class="rc-title">I sent money to the wrong person</span>
            <span class="rc-sub">A payment went to the wrong account</span></span></button>
          <button class="radio-card"><span><span class="rc-title">Something else</span>
            <span class="rc-sub">Tell us in your own words</span></span></button>
        </div>
      </div>

      <div class="field">
        <label>Which account?</label>
        <select class="select">
          ${accounts().map(a => `<option>${esc(a.nickname)} — ${esc(a.number)}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>Tell us what happened</label>
        <textarea class="input" rows="5" placeholder="Include dates, amounts and any reference numbers you have."></textarea>
      </div>
    </div>

    <div class="banner banner-info mb16">
      <span class="b-ico">${icon("info", 18)}</span>
      <div class="b-body"><b>What happens next</b>
        <p>A member of our complaints team will call you on ${maskPhone(CUSTOMER.phone)} within one working day.
        You&rsquo;ll get a reference number by SMS as soon as you submit.</p></div>
    </div>

    <button class="btn btn-cta btn-lg btn-block"
      onclick="go('support');toast('Report submitted — reference FR4471902','check')">
      Submit report</button>
    <p class="tiny faint center mt8">
      Handled under the Bank of Zambia Customer Complaints Handling Directive.
    </p>
  </div>`;
}
