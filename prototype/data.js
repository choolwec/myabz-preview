/* =============================================================
   MyABZ prototype — mock data
   -------------------------------------------------------------
   Everything here stands in for a backend response. Each block is
   annotated with the endpoint that will eventually supply it, so
   the shapes here are the shapes the API should return.

   PROVENANCE:
   - BANKS[].code       lifted verbatim from the live MyABZ bundle
   - BANKS[].swift      only the marked ones are verified; the rest
                        are placeholders and MUST be replaced from
                        the bank's own list before any real use
   - MNO prefixes       ZICTA allocations incl. the 2024 05x ranges
   - Branches/agents    SAMPLE data, not real addresses
   ============================================================= */

/* ---- GET /api/customer ---- */
const CUSTOMER = {
  id: "CU-4471902",
  name: "Chanda Mwale",
  firstName: "Chanda",
  initials: "CM",
  lastLogin: "2026-09-05T18:42:00",
  phone: "0977412580",
  email: "c.mwale@example.zm",
  // Entitlements drive what the UI renders. Server is the authority.
  entitlements: {
    canApprove: true,       // Mukula Plus corporate mandate
    canInitiate: true,
    canBulkPay: false,      // not built yet
    approvalLimit: 250000,
  },
  profiles: [
    { id: "PR-1", label: "Personal", type: "individual", tier: "Tamanga Plus" },
    { id: "PR-2", label: "Mwale General Dealers Ltd", type: "business", tier: "Mukula Plus" },
  ],
};

/* ---- GET /api/accounts ---- */
const ACCOUNTS = [
  {
    id: "AC-1", profileId: "PR-1", nickname: "Everyday",
    product: "Tamanga Plus Current", number: "0021447190201",
    currency: "ZMW", balance: 48320.75, available: 47820.75,
    type: "current", status: "active",
  },
  {
    id: "AC-2", profileId: "PR-1", nickname: "Savings",
    product: "Savings Account", number: "0021447190244",
    currency: "ZMW", balance: 125000.00, available: 125000.00,
    type: "savings", status: "active", interestRate: 6.5,
  },
  {
    id: "AC-3", profileId: "PR-1", nickname: "Dollar account",
    product: "Foreign Currency Current", number: "0021447190277",
    currency: "USD", balance: 3240.50, available: 3240.50,
    type: "current", status: "active",
  },
  {
    id: "AC-4", profileId: "PR-2", nickname: "Business operating",
    product: "Mukula Plus Current", number: "0031882640100",
    currency: "ZMW", balance: 312905.40, available: 305905.40,
    type: "current", status: "active",
  },
];

/* ---- GET /api/loans ---- */
const LOANS = [
  {
    id: "LN-1", profileId: "PR-2", product: "Business Growth Loan",
    reference: "BGL-2025-08841", currency: "ZMW",
    principal: 180000, outstanding: 96450.20,
    instalment: 8920.15, nextDue: "2026-09-28",
    rate: 28.5, termMonths: 24, paid: 12, status: "current",
  },
  {
    id: "LN-2", profileId: "PR-1", product: "Personal Loan",
    reference: "PL-2026-02219", currency: "ZMW",
    principal: 45000, outstanding: 12180.00,
    instalment: 4060.00, nextDue: "2026-09-22",
    rate: 32.0, termMonths: 12, paid: 9, status: "current",
  },
];

const LOAN_SCHEDULE = [
  { n: 10, due: "2026-07-28", principal: 6120.40, interest: 2799.75, total: 8920.15, status: "paid" },
  { n: 11, due: "2026-08-28", principal: 6265.72, interest: 2654.43, total: 8920.15, status: "paid" },
  { n: 12, due: "2026-09-28", principal: 6414.53, interest: 2505.62, total: 8920.15, status: "due" },
  { n: 13, due: "2026-10-28", principal: 6566.87, interest: 2353.28, total: 8920.15, status: "upcoming" },
  { n: 14, due: "2026-11-28", principal: 6722.83, interest: 2197.32, total: 8920.15, status: "upcoming" },
  { n: 15, due: "2026-12-28", principal: 6882.50, interest: 2037.65, total: 8920.15, status: "upcoming" },
];

/* ---- GET /api/transactions ---- */
const TRANSACTIONS = [
  { id: "TX-101", accountId: "AC-1", date: "2026-09-06T09:14:00", desc: "ZESCO prepaid token", detail: "Meter 04182773910", category: "Utilities", amount: -450.00, currency: "ZMW", balance: 48320.75, status: "completed", ref: "ZES8841027" },
  { id: "TX-102", accountId: "AC-1", date: "2026-09-05T16:02:00", desc: "MTN airtime", detail: "0966102847", category: "Airtime", amount: -100.00, currency: "ZMW", balance: 48770.75, status: "completed", ref: "AIR2290418" },
  { id: "TX-103", accountId: "AC-1", date: "2026-09-05T11:38:00", desc: "Transfer to B. Phiri", detail: "Zanaco · 0100224419", category: "Transfer", amount: -3200.00, currency: "ZMW", balance: 48870.75, status: "completed", ref: "TRF7719204" },
  { id: "TX-104", accountId: "AC-1", date: "2026-09-04T08:20:00", desc: "Salary", detail: "Mwale General Dealers Ltd", category: "Income", amount: 22000.00, currency: "ZMW", balance: 52070.75, status: "completed", ref: "SAL0904261" },
  { id: "TX-105", accountId: "AC-1", date: "2026-09-03T14:55:00", desc: "Airtel Money transfer", detail: "0977889120", category: "Mobile money", amount: -1500.00, currency: "ZMW", balance: 30070.75, status: "completed", ref: "MM44018827" },
  { id: "TX-106", accountId: "AC-1", date: "2026-09-02T10:11:00", desc: "DStv subscription", detail: "Smartcard 4088217740", category: "Utilities", amount: -890.00, currency: "ZMW", balance: 31570.75, status: "completed", ref: "DST1194402" },
  { id: "TX-107", accountId: "AC-1", date: "2026-09-01T17:47:00", desc: "School fees", detail: "Lusaka Trust School", category: "Education", amount: -7500.00, currency: "ZMW", balance: 32460.75, status: "completed", ref: "EDU8820174" },
  { id: "TX-108", accountId: "AC-1", date: "2026-08-30T12:03:00", desc: "Transfer to own account", detail: "To Savings 0021447190244", category: "Transfer", amount: -5000.00, currency: "ZMW", balance: 39960.75, status: "completed", ref: "OWN2048817" },
  { id: "TX-109", accountId: "AC-1", date: "2026-08-29T09:25:00", desc: "Lusaka Water", detail: "Account 771029448", category: "Utilities", amount: -320.00, currency: "ZMW", balance: 44960.75, status: "completed", ref: "LWS1180294" },
  { id: "TX-110", accountId: "AC-1", date: "2026-08-28T15:30:00", desc: "Loan repayment", detail: "PL-2026-02219", category: "Loan", amount: -4060.00, currency: "ZMW", balance: 45280.75, status: "completed", ref: "LNR9920184" },
  { id: "TX-111", accountId: "AC-4", date: "2026-09-06T08:02:00", desc: "Supplier payment", detail: "Kabwe Hardware Ltd", category: "Supplier", amount: -18400.00, currency: "ZMW", balance: 312905.40, status: "completed", ref: "SUP7740219" },
  { id: "TX-112", accountId: "AC-4", date: "2026-09-05T13:41:00", desc: "Customer deposit", detail: "Cash — Cairo Road branch", category: "Income", amount: 64000.00, currency: "ZMW", balance: 331305.40, status: "completed", ref: "DEP2298104" },
  { id: "TX-113", accountId: "AC-3", date: "2026-09-02T11:00:00", desc: "Inward SWIFT", detail: "Shenzhen Trading Co", category: "Income", amount: 2400.00, currency: "USD", balance: 3240.50, status: "completed", ref: "SWF4471028" },
  { id: "TX-114", accountId: "AC-1", date: "2026-09-06T07:30:00", desc: "Transfer to J. Banda", detail: "Stanbic · 9110284471", category: "Transfer", amount: -2000.00, currency: "ZMW", status: "pending", ref: "TRF8820471" },
];

/* ---- GET /api/approvals ---- */
const APPROVALS = [
  { id: "AP-1", accountId: "AC-4", raisedBy: "T. Nkandu", raisedAt: "2026-09-06T08:41:00", type: "Transfer to another bank", beneficiary: "Kabwe Hardware Ltd", bank: "ZNCBK", accountNumber: "0100448271", amount: 42000.00, currency: "ZMW", reference: "Sept stock order" },
  { id: "AP-2", accountId: "AC-4", raisedBy: "T. Nkandu", raisedAt: "2026-09-06T08:52:00", type: "Mobile money", beneficiary: "M. Zulu", accountNumber: "0966410228", amount: 3500.00, currency: "ZMW", reference: "Transport reimbursement" },
  { id: "AP-3", accountId: "AC-4", raisedBy: "G. Sakala", raisedAt: "2026-09-05T16:20:00", type: "Utility payment", beneficiary: "ZESCO", accountNumber: "04182773910", amount: 8200.00, currency: "ZMW", reference: "Warehouse electricity" },
];

/* ---- GET /api/banks ----
   `code` values are verbatim from the production MyABZ bundle.
   swiftVerified: true means the BIC was confirmed from a public source. */
const BANKS = [
  { code: "ABBAK", name: "AB Bank Zambia Limited", short: "AB Bank", swift: "ABZMZMLU", swiftVerified: false },
  { code: "ZNCBK", name: "Zambia National Commercial Bank Plc", short: "Zanaco", swift: "ZNCOZMLU", swiftVerified: false },
  { code: "STBBK", name: "Stanbic Bank Zambia Limited", short: "Stanbic", swift: "SBICZMLX", swiftVerified: false },
  { code: "BBZZM", name: "Absa Bank Zambia Plc", short: "Absa", swift: "BARCZMLX", swiftVerified: true },
  { code: "ACCES", name: "Access Bank Zambia Limited", short: "Access Bank", swift: "AMZMZMLU", swiftVerified: false },
  { code: "INDOZ", name: "Indo-Zambia Bank Limited", short: "Indo-Zambia", swift: "IZBAZMLU", swiftVerified: false },
  { code: "SCBZM", name: "Standard Chartered Bank Plc", short: "Standard Chartered", swift: "SCBLZMLX", swiftVerified: false },
  { code: "FNBZM", name: "First National Bank", short: "FNB", swift: "FIRNZMLX", swiftVerified: false },
  { code: "CITIB", name: "Citibank Zambia Limited", short: "Citibank", swift: "CITIZMLX", swiftVerified: false },
  { code: "ECOBK", name: "Ecobank Zambia Limited", short: "Ecobank", swift: "ECOCZMLU", swiftVerified: false },
  { code: "FABZM", name: "First Alliance Bank Zambia Limited", short: "First Alliance", swift: "FABZZMLU", swiftVerified: false },
  { code: "ZICBK", name: "Zambia Industrial Commercial Bank", short: "ZICB", swift: "ZICBZMLU", swiftVerified: false },
  { code: "ITBBK", name: "Investrust Bank Plc", short: "Investrust", swift: "ITBLZMLU", swiftVerified: false },
  { code: "UBABK", name: "United Bank for Africa Zambia Limited", short: "UBA", swift: "UNAFZMLX", swiftVerified: false },
  { code: "BOCBK", name: "Bank of China", short: "Bank of China", swift: "BKCHZMLU", swiftVerified: false },
  { code: "BOZBK", name: "Bank of Zambia", short: "Bank of Zambia", swift: "BAZAZMLU", swiftVerified: true },
  // NOTE: production maps "STBBK" to BOTH Stanbic and First Capital — a live bug.
  // First Capital is given its own code here; the backend must supply the correct one.
  { code: "FCBZM", name: "First Capital Bank Zambia Limited", short: "First Capital", swift: "FCBZZMLU", swiftVerified: false, note: "Code collides with Stanbic in production — verify" },
];

/* ---- Mobile network operators. ZICTA prefix allocations. ---- */
const MNOS = [
  { id: "airtel", name: "Airtel Money", short: "Airtel", prefixes: ["097", "077", "057"], colour: "#E4002B" },
  { id: "mtn", name: "MTN Mobile Money", short: "MTN", prefixes: ["096", "076", "056"], colour: "#FFCB05" },
  { id: "zamtel", name: "Zamtel Kwacha", short: "Zamtel", prefixes: ["095", "075", "055"], colour: "#00A651" },
];

/* ---- GET /api/billers ---- */
const BILLERS = [
  { id: "zesco", name: "ZESCO", category: "Electricity", field: "Meter number", placeholder: "04182773910", prepaid: true },
  { id: "lwsc", name: "Lusaka Water & Sanitation", category: "Water", field: "Account number", placeholder: "771029448" },
  { id: "nwsc", name: "Nkana Water & Sanitation", category: "Water", field: "Account number", placeholder: "220417" },
  { id: "dstv", name: "DStv", category: "TV", field: "Smartcard number", placeholder: "4088217740" },
  { id: "gotv", name: "GOtv", category: "TV", field: "IUC number", placeholder: "2019447102" },
  { id: "unza", name: "University of Zambia", category: "Education", field: "Student number", placeholder: "2022114478" },
  { id: "cbu", name: "Copperbelt University", category: "Education", field: "Student number", placeholder: "19104472" },
  { id: "zra", name: "Zambia Revenue Authority", category: "Government", field: "TPIN", placeholder: "1002447190", badge: "New" },
  { id: "napsa", name: "NAPSA", category: "Government", field: "Employer number", placeholder: "0044719021", badge: "New" },
  { id: "nhima", name: "NHIMA", category: "Government", field: "Member number", placeholder: "NH04471902", badge: "New" },
];

/* ---- GET /api/templates (beneficiaries) ---- */
const TEMPLATES = [
  { id: "TP-1", name: "Bwalya Phiri", type: "bank", bank: "ZNCBK", accountNumber: "0100224419", lastUsed: "2026-09-05", uses: 14 },
  { id: "TP-2", name: "Kabwe Hardware Ltd", type: "bank", bank: "ZNCBK", accountNumber: "0100448271", lastUsed: "2026-09-06", uses: 31 },
  { id: "TP-3", name: "Joseph Banda", type: "bank", bank: "STBBK", accountNumber: "9110284471", lastUsed: "2026-09-06", uses: 7 },
  { id: "TP-4", name: "Mary Zulu", type: "mobile", mno: "mtn", accountNumber: "0966410228", lastUsed: "2026-09-03", uses: 22 },
  { id: "TP-5", name: "Grace Tembo", type: "mobile", mno: "airtel", accountNumber: "0977889120", lastUsed: "2026-09-03", uses: 9 },
  { id: "TP-6", name: "Lusaka Trust School", type: "bank", bank: "BBZZM", accountNumber: "3004417820", lastUsed: "2026-09-01", uses: 5 },
];

/* ---- GET /api/scheduled ---- */
const SCHEDULED = [
  { id: "SC-1", name: "Rent — Kabulonga", type: "bank", beneficiary: "P. Mulenga", amount: 9500.00, currency: "ZMW", frequency: "Monthly", nextRun: "2026-09-28", accountId: "AC-1", active: true },
  { id: "SC-2", name: "Loan repayment", type: "loan", beneficiary: "PL-2026-02219", amount: 4060.00, currency: "ZMW", frequency: "Monthly", nextRun: "2026-09-22", accountId: "AC-1", active: true },
  { id: "SC-3", name: "DStv subscription", type: "bill", beneficiary: "DStv", amount: 890.00, currency: "ZMW", frequency: "Monthly", nextRun: "2026-10-02", accountId: "AC-1", active: true },
  { id: "SC-4", name: "Savings sweep", type: "own", beneficiary: "Savings 0021447190244", amount: 5000.00, currency: "ZMW", frequency: "Monthly", nextRun: "2026-09-30", accountId: "AC-1", active: false },
];

/* ---- GET /api/fx/rates ---- */
const FX_RATES = [
  { pair: "USD/ZMW", buy: 26.42, sell: 27.18, change: +0.34 },
  { pair: "EUR/ZMW", buy: 28.90, sell: 29.75, change: -0.12 },
  { pair: "GBP/ZMW", buy: 33.55, sell: 34.60, change: +0.21 },
  { pair: "ZAR/ZMW", buy: 1.42, sell: 1.51, change: +0.02 },
];

/* ---- GET /api/locations — SAMPLE DATA, not real addresses ---- */
const LOCATIONS = [
  { id: "L1", kind: "branch", name: "Cairo Road Branch", town: "Lusaka", address: "Cairo Road, Lusaka", hours: "08:00 – 16:00 Mon–Fri", phone: "888" },
  { id: "L2", kind: "branch", name: "Kabwata Branch", town: "Lusaka", address: "Burma Road, Kabwata", hours: "08:00 – 16:00 Mon–Fri", phone: "888" },
  { id: "L3", kind: "branch", name: "Chelston Branch", town: "Lusaka", address: "Great East Road, Chelston", hours: "08:00 – 16:00 Mon–Fri", phone: "888" },
  { id: "L4", kind: "branch", name: "Kitwe Branch", town: "Kitwe", address: "Obote Avenue, Kitwe", hours: "08:00 – 16:00 Mon–Fri", phone: "888" },
  { id: "L5", kind: "branch", name: "Ndola Branch", town: "Ndola", address: "President Avenue, Ndola", hours: "08:00 – 16:00 Mon–Fri", phone: "888" },
  { id: "L6", kind: "branch", name: "Chipata Branch", town: "Chipata", address: "Umodzi Highway, Chipata", hours: "08:00 – 16:00 Mon–Fri", phone: "888" },
  { id: "L7", kind: "agent", name: "Kazang — Soweto Market", town: "Lusaka", address: "Soweto Market, Lusaka", hours: "07:00 – 18:00 daily", network: "Kazang" },
  { id: "L8", kind: "agent", name: "543 Konse Konse — Matero", town: "Lusaka", address: "Matero Shopping Centre", hours: "07:00 – 19:00 daily", network: "543 Konse Konse" },
  { id: "L9", kind: "agent", name: "Kazang — Chisokone Market", town: "Kitwe", address: "Chisokone Market, Kitwe", hours: "07:00 – 18:00 daily", network: "Kazang" },
  { id: "L10", kind: "agent", name: "543 Konse Konse — Kamwala", town: "Lusaka", address: "Kamwala Trading Area", hours: "07:00 – 19:00 daily", network: "543 Konse Konse" },
];

/* ---- GET /api/notifications ---- */
const NOTIFICATIONS = [
  { id: "N1", at: "2026-09-06T09:14:00", title: "ZESCO token purchased", body: "K450.00 · token 1847 2290 4471 0028", kind: "transaction", unread: true },
  { id: "N2", at: "2026-09-06T08:52:00", title: "Approval waiting", body: "T. Nkandu raised a mobile money payment of K3,500.00", kind: "approval", unread: true },
  { id: "N3", at: "2026-09-06T08:41:00", title: "Approval waiting", body: "T. Nkandu raised a transfer of K42,000.00", kind: "approval", unread: true },
  { id: "N4", at: "2026-09-05T18:42:00", title: "New sign-in", body: "Android device · Lusaka", kind: "security", unread: false },
  { id: "N5", at: "2026-09-04T08:20:00", title: "Salary received", body: "K22,000.00 from Mwale General Dealers Ltd", kind: "transaction", unread: false },
];

/* ---- Airtime bundles ---- */
const BUNDLES = {
  airtel: [
    { id: "a1", label: "Daily 500MB", price: 15, validity: "24 hours" },
    { id: "a2", label: "Weekly 2GB", price: 60, validity: "7 days" },
    { id: "a3", label: "Monthly 10GB", price: 250, validity: "30 days" },
    { id: "a4", label: "Monthly 25GB", price: 500, validity: "30 days" },
  ],
  mtn: [
    { id: "m1", label: "Daily 750MB", price: 15, validity: "24 hours" },
    { id: "m2", label: "Weekly 3GB", price: 70, validity: "7 days" },
    { id: "m3", label: "Monthly 12GB", price: 260, validity: "30 days" },
    { id: "m4", label: "Monthly 30GB", price: 520, validity: "30 days" },
  ],
  zamtel: [
    { id: "z1", label: "Daily 1GB", price: 12, validity: "24 hours" },
    { id: "z2", label: "Weekly 4GB", price: 55, validity: "7 days" },
    { id: "z3", label: "Monthly 15GB", price: 220, validity: "30 days" },
    { id: "z4", label: "Monthly 40GB", price: 480, validity: "30 days" },
  ],
};

/* ---- Beneficiary name lookup (simulates account-name verification) ---- */
const NAME_LOOKUP = {
  "0100224419": "BWALYA PHIRI",
  "0100448271": "KABWE HARDWARE LIMITED",
  "9110284471": "JOSEPH BANDA",
  "3004417820": "LUSAKA TRUST SCHOOL",
  "0966410228": "MARY ZULU",
  "0977889120": "GRACE TEMBO",
  "0021447190244": "CHANDA MWALE",
};

/* ---- Interbank payment rails (GET /reference/rails) ----------------
   Zambia has three ways to move money to another bank, and they are not
   interchangeable:

     RTGS  Bank of Zambia's Zambian Interbank Payment and Settlement
           System (ZIPSS). Settles one payment at a time in real time;
           final and irrevocable. Used for high-value payments.
     EFT   Cleared in batches through ZECHL's Direct Debit and Credit
           Clearing (DDACC). Kwacha only, within Zambia only. Cheaper,
           but not immediate.
     NFS   ZECHL's National Financial Switch. Real-time interbank
           transfers, available around the clock.

   WARNING: `minAmount` / `maxAmount` below encode AB Bank's own routing
   rule. The K50,000 split could not be confirmed from a public source,
   and the NFS ceiling is Zanaco's published limit. Both must be
   confirmed against AB Bank's own scheme rules before production —
   they are here in one place so a single edit changes the whole app. */
const RAILS = [
  {
    id: "rtgs",
    name: "RTGS",
    full: "Real Time Gross Settlement",
    eta: "Within minutes",
    best: "Payments of K50,000 and above",
    detail: "Settled one payment at a time by the Bank of Zambia. Final and irrevocable once sent.",
    availability: "Bank working hours",
    minAmount: 50000,
    maxAmount: null,
  },
  {
    id: "eft",
    name: "EFT",
    full: "Electronic Funds Transfer",
    eta: "A few hours, same working day",
    best: "Everyday payments under K50,000",
    detail: "Cleared in batches through the Zambia Electronic Clearing House. Kwacha, within Zambia only.",
    availability: "Cut-off times apply",
    minAmount: 0,
    maxAmount: 49999.99,
  },
  {
    id: "nfs",
    name: "NFS",
    full: "National Financial Switch",
    eta: "Instantly",
    best: "When it has to arrive now",
    detail: "Real-time interbank transfer through the Zambia Electronic Clearing House.",
    availability: "24 hours a day",
    minAmount: 0,
    maxAmount: 500000,
  },
];
