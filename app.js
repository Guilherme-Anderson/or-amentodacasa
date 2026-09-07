(() => {
  "use strict";

  const APP_VERSION = "2.9.1";
  const OFFLINE_QUEUE_KEY = "gastos-da-casa-offline-v2";
  const THEME_STORAGE_KEY = "gastos-da-casa-theme";
  const LAST_FORMA_KEY = "gastos-da-casa-last-forma";
  const LAST_ORCAMENTO_KEY = "gastos-da-casa-last-orcamento";
  const DEFAULT_CARD_CONFIG = {
    dia_fechamento: 3,
    dia_vencimento: 10,
    saldo_inicial: 0,
    saldo_inicial_competencia: null
  };
  const ALLOWED_PAYMENT_METHODS = new Set(["PIX", "BYBIT", "NUBANK", "ALELO"]);
  const ALLOWED_BUDGET_CATEGORIES = new Set([
    "Dizimo",
    "Custo Fixo",
    "Conforto",
    "Prazer",
    "Metas",
    "Conhecimento",
    "Liberdade Financeira"
  ]);
  const CATEGORY_TARGETS = [
    ["Dizimo", 10],
    ["Custo Fixo", 40],
    ["Conforto", 10],
    ["Prazer", 5],
    ["Metas", 10],
    ["Conhecimento", 5],
    ["Liberdade Financeira", 20]
  ];
  const CATEGORY_COLORS = {
    Dizimo: "#f59e0b",
    "Custo Fixo": "#3b82f6",
    Conforto: "#10b981",
    Prazer: "#ec4899",
    Metas: "#8b5cf6",
    Conhecimento: "#06b6d4",
    "Liberdade Financeira": "#f97316"
  };
  const CATEGORY_SHORT_LABELS = {
    "Liberdade Financeira": "Liberdade Fin."
  };

  function shortCategoryLabel(category) {
    return CATEGORY_SHORT_LABELS[category] || category;
  }

  const elements = {
    loginView: document.querySelector("#login-view"),
    appView: document.querySelector("#app-view"),
    entryScreen: document.querySelector("#entry-screen"),
    historyScreen: document.querySelector("#history-screen"),
    dashboardScreen: document.querySelector("#dashboard-screen"),
    reportScreen: document.querySelector("#report-screen"),
    loginForm: document.querySelector("#login-form"),
    expenseForm: document.querySelector("#expense-form"),
    loginMessage: document.querySelector("#login-message"),
    expenseMessage: document.querySelector("#expense-message"),
    diagnosticMessage: document.querySelector("#diagnostic-message"),
    loginButton: document.querySelector("#login-button"),
    saveButton: document.querySelector("#save-button"),
    logoutButtons: [...document.querySelectorAll(".logout-button")],
    openHistoryButton: document.querySelector("#open-history-button"),
    openDashboardButton: document.querySelector("#open-dashboard-button"),
    openReportButton: document.querySelector("#open-report-button"),
    backEntryButton: document.querySelector("#back-entry-button"),
    backDashboardButton: document.querySelector("#back-dashboard-button"),
    backReportButton: document.querySelector("#back-report-button"),
    refreshButton: document.querySelector("#refresh-button"),
    showPassword: document.querySelector("#show-password"),
    email: document.querySelector("#email"),
    password: document.querySelector("#password"),
    gasto: document.querySelector("#gasto"),
    valor: document.querySelector("#valor"),
    forma: document.querySelector("#forma"),
    installmentsField: document.querySelector("#installments-field"),
    parcelas: document.querySelector("#parcelas"),
    orcamento: document.querySelector("#orcamento"),
    agora: document.querySelector("#agora"),
    dateField: document.querySelector("#date-field"),
    dateInput: document.querySelector("#data-hora"),
    observacao: document.querySelector("#observacao"),
    recentList: document.querySelector("#recent-list"),
    personFilter: document.querySelector("#person-filter"),
    monthFilter: document.querySelector("#month-filter"),
    yearFilter: document.querySelector("#year-filter"),
    historyCount: document.querySelector("#history-count"),
    historyTotal: document.querySelector("#history-total"),
    categorySummary: document.querySelector("#category-summary"),
    signedUser: document.querySelector("#signed-user"),
    toast: document.querySelector("#toast"),
    themeToggles: [...document.querySelectorAll("[data-theme-toggle]")],
    themeColor: document.querySelector('meta[name="theme-color"]'),
    gastoSuggestions: document.querySelector("#gasto-suggestions"),
    editBanner: document.querySelector("#edit-banner"),
    cancelEditButton: document.querySelector("#cancel-edit-button"),
    confirmOverlay: document.querySelector("#confirm-overlay"),
    confirmMessage: document.querySelector("#confirm-message"),
    confirmCancelButton: document.querySelector("#confirm-cancel-button"),
    confirmOkButton: document.querySelector("#confirm-ok-button"),
    dashboardPeriod: document.querySelector("#dashboard-period"),
    dashboardTotal: document.querySelector("#dashboard-total"),
    dashboardCount: document.querySelector("#dashboard-count"),
    dashboardDonut: document.querySelector("#dashboard-donut"),
    dashboardLegend: document.querySelector("#dashboard-legend"),
    dashboardGoals: document.querySelector("#dashboard-goals"),
    dashboardMonthFilter: document.querySelector("#dashboard-month-filter"),
    dashboardYearFilter: document.querySelector("#dashboard-year-filter"),
    dashboardAvailable: document.querySelector("#dashboard-available"),
    dashboardIncomeDisplay: document.querySelector("#dashboard-income-display"),
    dashboardIncomeValue: document.querySelector("#dashboard-income-value"),
    dashboardIncomeEdit: document.querySelector("#dashboard-income-edit"),
    dashboardIncomeInput: document.querySelector("#dashboard-income-input"),
    editIncomeButton: document.querySelector("#edit-income-button"),
    cancelIncomeButton: document.querySelector("#cancel-income-button"),
    saveIncomeButton: document.querySelector("#save-income-button"),
    reportSearch: document.querySelector("#report-search"),
    reportPersonFilter: document.querySelector("#report-person-filter"),
    reportCategoryFilter: document.querySelector("#report-category-filter"),
    reportFormaFilter: document.querySelector("#report-forma-filter"),
    reportMonthFilter: document.querySelector("#report-month-filter"),
    reportYearFilter: document.querySelector("#report-year-filter"),
    reportCount: document.querySelector("#report-count"),
    reportTotal: document.querySelector("#report-total"),
    reportGroups: document.querySelector("#report-groups"),
    cardScreen: document.querySelector("#card-screen"),
    openCardButton: document.querySelector("#open-card-button"),
    backCardButton: document.querySelector("#back-card-button"),
    faturaField: document.querySelector("#fatura-field"),
    faturaInput: document.querySelector("#fatura-competencia"),
    faturaReset: document.querySelector("#fatura-reset"),
    faturaHint: document.querySelector("#fatura-hint"),
    installmentHint: document.querySelector("#installment-hint"),
    cardConfigDisplay: document.querySelector("#card-config-display"),
    cardConfigSummary: document.querySelector("#card-config-summary"),
    cardConfigEdit: document.querySelector("#card-config-edit"),
    editCardConfigButton: document.querySelector("#edit-card-config-button"),
    cancelCardConfigButton: document.querySelector("#cancel-card-config-button"),
    saveCardConfigButton: document.querySelector("#save-card-config-button"),
    cardClosingInput: document.querySelector("#card-closing-input"),
    cardDueInput: document.querySelector("#card-due-input"),
    cardInitialInput: document.querySelector("#card-initial-input"),
    cardInitialMonthInput: document.querySelector("#card-initial-month-input"),
    cardPrevButton: document.querySelector("#card-prev-button"),
    cardNextButton: document.querySelector("#card-next-button"),
    cardPeriod: document.querySelector("#card-period"),
    cardCycleInfo: document.querySelector("#card-cycle-info"),
    cardTotal: document.querySelector("#card-total"),
    cardPaid: document.querySelector("#card-paid"),
    cardOpen: document.querySelector("#card-open"),
    cardPaymentToggle: document.querySelector("#card-payment-toggle"),
    cardPaymentForm: document.querySelector("#card-payment-form"),
    cardPaymentValue: document.querySelector("#card-payment-value"),
    cardPaymentDate: document.querySelector("#card-payment-date"),
    cardPaymentObs: document.querySelector("#card-payment-obs"),
    cardPaymentCancel: document.querySelector("#card-payment-cancel"),
    cardPaymentSave: document.querySelector("#card-payment-save"),
    cardPaymentsList: document.querySelector("#card-payments-list"),
    cardPurchasesList: document.querySelector("#card-purchases-list"),
    cardFutureTotal: document.querySelector("#card-future-total"),
    cardFutureDetail: document.querySelector("#card-future-detail")
  };

  let supabaseClient = null;
  let currentSession = null;
  let toastTimer = null;
  let authRenderToken = 0;
  let activeScreen = "entry";
  let historyNeedsRefresh = true;
  let allExpenses = [];
  let membersById = new Map();
  let editingExpenseId = null;
  let filtersDefaulted = false;
  let dashboardFiltersDefaulted = false;
  let monthlyIncome = 0;
  let selectedCategoryFilter = "";
  let reportFiltersDefaulted = false;
  let cardConfig = null;
  let cardPayments = [];
  let cardCompetencia = "";
  let cardEmAberto = 0;
  let faturaManual = false;

  const moneyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });

  const dateOnlyFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

  // ---- Competência (mês da fatura) ----------------------------------------
  // A competência é sempre representada como "AAAA-MM-01" para evitar as
  // armadilhas de fuso ao converter datas puras com new Date().
  function firstDayISO(year, monthIndex) {
    const normalized = new Date(year, monthIndex, 1);
    return `${normalized.getFullYear()}-${String(normalized.getMonth() + 1).padStart(2, "0")}-01`;
  }

  function competenciaParts(value) {
    const [year, month] = String(value || "").split("-").map(Number);
    return { year: year || 0, month: month || 0 };
  }

  function competenciaMonthISO(dateValue) {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      return firstDayISO(now.getFullYear(), now.getMonth());
    }
    return firstDayISO(date.getFullYear(), date.getMonth());
  }

  // Regra do cartão: uma compra até o dia do fechamento entra na fatura que
  // fecha naquele mês; depois disso, entra na próxima. A competência é o mês
  // do vencimento dessa fatura.
  function competenciaFromPurchase(dateValue, closingDay, dueDay) {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return competenciaMonthISO(new Date());

    const closing = Number(closingDay) || DEFAULT_CARD_CONFIG.dia_fechamento;
    const due = Number(dueDay) || DEFAULT_CARD_CONFIG.dia_vencimento;

    let monthIndex = date.getMonth();
    if (date.getDate() > closing) monthIndex += 1;
    if (due <= closing) monthIndex += 1;
    return firstDayISO(date.getFullYear(), monthIndex);
  }

  function addMonthsISO(value, months) {
    const { year, month } = competenciaParts(value);
    if (!year || !month) return competenciaMonthISO(new Date());
    return firstDayISO(year, month - 1 + months);
  }

  function sameCompetencia(a, b) {
    const pa = competenciaParts(a);
    const pb = competenciaParts(b);
    return pa.year > 0 && pa.year === pb.year && pa.month === pb.month;
  }

  function competenciaIsAfter(value, reference) {
    const pv = competenciaParts(value);
    const pr = competenciaParts(reference);
    if (!pv.year) return false;
    return pv.year > pr.year || (pv.year === pr.year && pv.month > pr.month);
  }

  function competenciaLabel(value) {
    const { year, month } = competenciaParts(value);
    if (!year || !month) return "—";
    const label = monthLabelFormatter.format(new Date(year, month - 1, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function normalizeEnvValue(rawValue, acceptedNames = []) {
    let value = String(rawValue ?? "").trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim();
    }

    for (const name of acceptedNames) {
      const prefix = `${name}=`;
      if (value.startsWith(prefix)) {
        value = value.slice(prefix.length).trim();
      }
    }

    return value;
  }

  const rawConfig = window.APP_CONFIG || {};
  const config = {
    url: normalizeEnvValue(rawConfig.SUPABASE_URL, [
      "SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "VITE_SUPABASE_URL"
    ]).replace(/\/+$/, ""),
    key: normalizeEnvValue(
      rawConfig.SUPABASE_PUBLISHABLE_KEY || rawConfig.SUPABASE_ANON_KEY,
      [
        "SUPABASE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "VITE_SUPABASE_PUBLISHABLE_KEY",
        "SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "VITE_SUPABASE_ANON_KEY"
      ]
    )
  };

  function validateConfig() {
    const problems = [];

    if (!config.url || config.url.includes("COLE_AQUI")) {
      problems.push("A URL do Supabase não foi preenchida no config.js.");
    } else {
      try {
        const parsed = new URL(config.url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          problems.push("A URL do Supabase precisa começar com https://.");
        }
        if (!parsed.hostname.endsWith(".supabase.co") && parsed.hostname !== "localhost") {
          problems.push("A URL informada não parece ser uma Project URL do Supabase.");
        }
      } catch {
        problems.push("A URL do Supabase está inválida.");
      }
    }

    if (!config.key || config.key.includes("COLE_AQUI")) {
      problems.push("A chave publicável não foi preenchida no config.js.");
    } else if (!(config.key.startsWith("sb_publishable_") || config.key.startsWith("eyJ"))) {
      problems.push("A chave não parece ser uma Publishable key nem uma chave anon legada.");
    }

    if (!window.supabase?.createClient) {
      problems.push("A biblioteca do Supabase não carregou. Verifique a internet e recarregue a página.");
    }

    return problems;
  }

  function setMessage(element, text = "", type = "") {
    element.textContent = text;
    element.className = `form-message${type ? ` ${type}` : ""}`;
  }

  function setLoading(button, loading, loadingText, normalText) {
    button.disabled = loading;
    button.textContent = loading ? loadingText : normalText;
  }

  function applyTheme(theme, persist = true) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";
    const isDark = normalizedTheme === "dark";

    document.documentElement.dataset.theme = normalizedTheme;

    if (elements.themeColor) {
      elements.themeColor.content = isDark ? "#080f1d" : "#f4f7fb";
    }

    elements.themeToggles.forEach((button) => {
      button.setAttribute("aria-label", isDark ? "Ativar modo claro" : "Ativar modo escuro");
      button.title = isDark ? "Ativar modo claro" : "Ativar modo escuro";

      const label = button.querySelector(".theme-toggle-label");
      if (label) label.textContent = isDark ? "Claro" : "Escuro";
    });

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
      } catch {
        // O tema continua funcionando mesmo que o armazenamento local esteja indisponível.
      }
    }
  }

  function initializeTheme() {
    let savedTheme = "light";

    try {
      savedTheme = localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch {
      savedTheme = "light";
    }

    applyTheme(savedTheme, false);

    elements.themeToggles.forEach((button) => {
      button.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
      });
    });
  }

  function showToast(text) {
    elements.toast.textContent = text;
    elements.toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("visible");
    }, 2800);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function randomUuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  function parseMoney(value) {
    let cleaned = String(value || "")
      .trim()
      .replace(/^R\$\s?/, "")
      .replace(/\s/g, "");

    if (!cleaned) return Number.NaN;

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    if (lastComma >= 0 && lastDot >= 0) {
      cleaned = lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
    } else if (lastComma >= 0) {
      cleaned = cleaned.replace(",", ".");
    }

    const number = Number(cleaned);
    return Number.isFinite(number) ? Math.round(number * 100) / 100 : Number.NaN;
  }

  function formatMoneyInput(event) {
    const input = event?.target || elements.valor;
    const value = parseMoney(input.value);
    if (Number.isFinite(value)) {
      input.value = value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }

  function toLocalDateTimeValue(date = new Date()) {
    const offsetInMinutes = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offsetInMinutes * 60_000);
    return localDate.toISOString().slice(0, 16);
  }

  function toggleDateField() {
    const useCurrentDate = elements.agora.checked;
    elements.dateField.classList.toggle("hidden", useCurrentDate);
    elements.dateInput.required = !useCurrentDate;

    if (!useCurrentDate && !elements.dateInput.value) {
      elements.dateInput.value = toLocalDateTimeValue();
    }
  }

  function toggleInstallmentsField() {
    const isNubank = elements.forma.value === "NUBANK";
    elements.installmentsField.classList.toggle("hidden", !isNubank);
    elements.parcelas.disabled = !isNubank;
    elements.parcelas.required = isNubank;

    if (isNubank && !elements.parcelas.value) {
      elements.parcelas.value = "1";
    }
  }

  function setAuthenticatedView(isAuthenticated) {
    elements.loginView.classList.toggle("hidden", isAuthenticated);
    elements.appView.classList.toggle("hidden", !isAuthenticated);
  }

  function showAppScreen(screenName) {
    const dataScreens = ["history", "dashboard", "report", "card"];
    const target = dataScreens.includes(screenName) ? screenName : "entry";
    activeScreen = target;

    elements.entryScreen.classList.toggle("hidden", target !== "entry");
    elements.historyScreen.classList.toggle("hidden", target !== "history");
    elements.dashboardScreen.classList.toggle("hidden", target !== "dashboard");
    elements.reportScreen.classList.toggle("hidden", target !== "report");
    elements.cardScreen.classList.toggle("hidden", target !== "card");

    if (dataScreens.includes(target)) {
      if (historyNeedsRefresh) {
        void loadRecent();
      } else if (target === "dashboard") {
        renderDashboard();
      } else if (target === "report") {
        renderReport();
      } else if (target === "card") {
        renderCard();
      }
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
    window.setTimeout(() => elements.gasto.focus({ preventScroll: true }), 0);
  }

  function formatAuthError(error) {
    const code = String(error?.code || "sem_codigo");
    const message = String(error?.message || "Erro desconhecido");
    const normalized = `${code} ${message}`.toLowerCase();

    let friendlyMessage;

    if (normalized.includes("email_not_confirmed") || normalized.includes("email not confirmed")) {
      friendlyMessage =
        "O usuário existe, mas o e-mail ainda não foi confirmado. No Supabase, abra Authentication > Users e confirme esse usuário.";
    } else if (normalized.includes("invalid_credentials") || normalized.includes("invalid login credentials")) {
      friendlyMessage =
        "O Supabase recusou a combinação de e-mail e senha. Isso também acontece quando o usuário foi criado por convite, mas ainda não definiu uma senha. Abra Authentication > Users, entre no usuário e redefina a senha ou recrie-o usando Create new user com Auto Confirm User marcado.";
    } else if (normalized.includes("user_banned")) {
      friendlyMessage = "Esse usuário está bloqueado no Supabase.";
    } else if (normalized.includes("over_request_rate_limit") || normalized.includes("rate limit")) {
      friendlyMessage = "Foram feitas muitas tentativas. Aguarde alguns minutos e tente novamente.";
    } else if (normalized.includes("failed to fetch") || normalized.includes("network")) {
      friendlyMessage =
        "Não foi possível acessar o Supabase. Confira a internet, a Project URL e a Publishable key no config.js.";
    } else {
      friendlyMessage = "O Supabase retornou um erro durante o login.";
    }

    return `${friendlyMessage}\n\nDetalhe técnico: ${code} — ${message}`;
  }

  function getMemberLabel(userId) {
    const member = membersById.get(userId);
    if (!member) return "Pessoa não identificada";
    return member.nome || member.email || "Pessoa não identificada";
  }

  function populateHistoryFilters() {
    const selectedPerson = elements.personFilter.value;
    const selectedYear = elements.yearFilter.value;

    const personIds = new Set([
      ...membersById.keys(),
      ...allExpenses.map((item) => item.user_id).filter(Boolean)
    ]);
    const people = [...personIds]
      .map((userId) => ({ userId, label: getMemberLabel(userId) }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

    elements.personFilter.innerHTML = [
      '<option value="">Todas as pessoas</option>',
      ...people.map(
        (person) =>
          `<option value="${escapeHtml(person.userId)}">${escapeHtml(person.label)}</option>`
      )
    ].join("");

    if (people.some((person) => person.userId === selectedPerson)) {
      elements.personFilter.value = selectedPerson;
    }

    const years = [...new Set(
      allExpenses
        .map((item) => competenciaParts(item.competencia).year)
        .filter((year) => year > 0)
    )].sort((a, b) => b - a);

    elements.yearFilter.innerHTML = [
      '<option value="">Todos os anos</option>',
      ...years.map((year) => `<option value="${year}">${year}</option>`)
    ].join("");

    if (!filtersDefaulted) {
      filtersDefaulted = true;
      const now = new Date();
      const currentMonth = String(now.getMonth() + 1);
      const currentYear = String(now.getFullYear());

      if (years.some((year) => String(year) === currentYear)) {
        elements.monthFilter.value = currentMonth;
        elements.yearFilter.value = currentYear;
        return;
      }
    }

    if (years.some((year) => String(year) === selectedYear)) {
      elements.yearFilter.value = selectedYear;
    }
  }

  function getFilteredExpenses({ ignoreCategory = false } = {}) {
    const selectedPerson = elements.personFilter.value;
    const selectedMonth = Number(elements.monthFilter.value || 0);
    const selectedYear = Number(elements.yearFilter.value || 0);

    return allExpenses.filter((item) => {
      if (selectedPerson && item.user_id !== selectedPerson) return false;

      if (!ignoreCategory && selectedCategoryFilter) {
        const category = item.orcamento || "Sem categoria";
        if (category !== selectedCategoryFilter) return false;
      }

      const { year, month } = competenciaParts(item.competencia);
      if (!year || !month) return !selectedMonth && !selectedYear;
      if (selectedMonth && month !== selectedMonth) return false;
      if (selectedYear && year !== selectedYear) return false;
      return true;
    });
  }

  function updateHistorySummary(items) {
    const count = items.length;
    const total = items.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    elements.historyCount.textContent = `${count} ${count === 1 ? "lançamento" : "lançamentos"}`;
    elements.historyTotal.textContent = moneyFormatter.format(total);
  }

  function renderRecent(items) {
    updateHistorySummary(items || []);

    if (!items?.length) {
      elements.recentList.innerHTML =
        '<p class="empty-state">Nenhum lançamento encontrado para os filtros selecionados.</p>';
      return;
    }

    elements.recentList.innerHTML = items
      .map((item) => {
        const note = item.observacao
          ? `<p class="expense-note">${escapeHtml(item.observacao)}</p>`
          : "";

        const date = new Date(item.data_compra || item.ocorrido_em);
        const formattedDate = Number.isNaN(date.getTime())
          ? "Data inválida"
          : dateFormatter.format(date);

        const installments = Number(item.parcela_total) > 1
          ? ` · ${Number(item.parcela_num || 1)}/${Number(item.parcela_total)}`
          : "";

        return `
          <article class="expense-item">
            <div class="expense-main">
              <div class="expense-title-group">
                <h3>${escapeHtml(item.gasto)}</h3>
                <span class="expense-person">${escapeHtml(getMemberLabel(item.user_id))}</span>
              </div>
              <p class="expense-meta">${escapeHtml(item.forma)}${installments} · ${escapeHtml(item.orcamento || "Sem categoria")} · ${escapeHtml(formattedDate)}</p>
              ${note}
            </div>
            <div class="expense-side">
              <span class="expense-value">${moneyFormatter.format(Number(item.valor))}</span>
              <div class="expense-actions">
                <button type="button" class="expense-action-button" data-action="edit" data-id="${escapeHtml(item.id)}">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                  <span>Editar</span>
                </button>
                <button type="button" class="expense-action-button danger" data-action="delete" data-id="${escapeHtml(item.id)}">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </article>`;
      })
      .join("");
  }

  function renderCategorySummary(items) {
    if (!items.length) {
      elements.categorySummary.classList.add("hidden");
      elements.categorySummary.innerHTML = "";
      return;
    }

    const totalsByCategory = new Map();
    for (const item of items) {
      const category = item.orcamento || "Sem categoria";
      totalsByCategory.set(category, (totalsByCategory.get(category) || 0) + Number(item.valor || 0));
    }

    const rows = [...totalsByCategory.entries()].sort((a, b) => b[1] - a[1]);
    const maxValue = Math.max(...rows.map(([, value]) => value));

    elements.categorySummary.classList.remove("hidden");
    elements.categorySummary.innerHTML = rows
      .map(([category, value]) => {
        const percent = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
        const isActive = category === selectedCategoryFilter;
        return `
          <button type="button" class="category-summary-row${isActive ? " active" : ""}" data-category="${escapeHtml(category)}">
            <span class="bar" style="width:${percent}%"></span>
            <span>${escapeHtml(category)}</span>
            <strong>${moneyFormatter.format(value)}</strong>
          </button>`;
      })
      .join("");
  }

  function applyHistoryFilters() {
    renderRecent(getFilteredExpenses());
    renderCategorySummary(getFilteredExpenses({ ignoreCategory: true }));
  }

  function handleCategorySummaryClick(event) {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    const category = button.dataset.category;
    selectedCategoryFilter = selectedCategoryFilter === category ? "" : category;
    applyHistoryFilters();
  }

  const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

  function populateDashboardFilters() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const selectedYear = elements.dashboardYearFilter.value;

    const years = [...new Set(
      allExpenses
        .map((item) => competenciaParts(item.competencia).year)
        .filter((year) => year > 0)
    )];
    if (!years.includes(currentYear)) years.push(currentYear);
    years.sort((a, b) => b - a);

    elements.dashboardYearFilter.innerHTML = years
      .map((year) => `<option value="${year}">${year}</option>`)
      .join("");

    if (!dashboardFiltersDefaulted) {
      dashboardFiltersDefaulted = true;
      elements.dashboardMonthFilter.value = String(now.getMonth() + 1);
      elements.dashboardYearFilter.value = String(currentYear);
      return;
    }

    elements.dashboardYearFilter.value = years.some((year) => String(year) === selectedYear)
      ? selectedYear
      : String(currentYear);
  }

  function renderDashboard() {
    const now = new Date();
    const month = Number(elements.dashboardMonthFilter.value || now.getMonth() + 1);
    const year = Number(elements.dashboardYearFilter.value || now.getFullYear());

    const items = allExpenses.filter((item) => {
      const parts = competenciaParts(item.competencia);
      return parts.month === month && parts.year === year;
    });

    const total = items.reduce((sum, item) => sum + Number(item.valor || 0), 0);

    const totalsByCategory = new Map();
    for (const item of items) {
      const category = item.orcamento || "Sem categoria";
      totalsByCategory.set(category, (totalsByCategory.get(category) || 0) + Number(item.valor || 0));
    }

    const periodLabel = monthLabelFormatter.format(new Date(year, month - 1, 1));
    elements.dashboardPeriod.textContent = periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);
    elements.dashboardTotal.textContent = moneyFormatter.format(total);
    elements.dashboardCount.textContent = String(items.length);

    const available = monthlyIncome - total;
    elements.dashboardAvailable.textContent = moneyFormatter.format(available);
    elements.dashboardAvailable.classList.toggle("negative", available < 0);

    let cursor = 0;
    const gradientStops = [];
    const legendRows = [];
    const goalRows = [];

    for (const [category, targetPercent] of CATEGORY_TARGETS) {
      const value = totalsByCategory.get(category) || 0;
      const realPercent = total > 0 ? (value / total) * 100 : 0;
      const color = CATEGORY_COLORS[category] || "var(--muted)";

      if (value > 0) {
        const start = cursor;
        const end = cursor + realPercent;
        gradientStops.push(`${color} ${start}% ${end}%`);
        cursor = end;
      }

      legendRows.push(`
        <li class="dashboard-legend-row">
          <span class="dashboard-dot" style="background:${color}"></span>
          <span class="dashboard-legend-name">${escapeHtml(shortCategoryLabel(category))}</span>
          <span class="dashboard-legend-value">${moneyFormatter.format(value)}</span>
        </li>`);

      const ceiling = monthlyIncome * (targetPercent / 100);
      const remaining = ceiling - value;
      const isOver = remaining < -0.005;
      const percentUsed = ceiling > 0 ? (value / ceiling) * 100 : (value > 0 ? 100 : 0);
      const fillWidth = Math.min(100, percentUsed);
      const badgeLabel = isOver
        ? `Estourou ${moneyFormatter.format(Math.abs(remaining))}`
        : `Sobra ${moneyFormatter.format(remaining)}`;

      goalRows.push(`
        <div class="goal-row">
          <div class="goal-row-head">
            <span>${escapeHtml(category)}</span>
            <span class="goal-badge ${isOver ? "over" : "under"}">${badgeLabel}</span>
          </div>
          <div class="goal-track">
            <span class="goal-fill ${isOver ? "over" : ""}" style="width:${fillWidth}%"></span>
          </div>
          <div class="goal-row-value">
            <span>Limite ${moneyFormatter.format(ceiling)}</span>
            <span>Gasto ${moneyFormatter.format(value)}</span>
          </div>
        </div>`);
    }

    elements.dashboardDonut.style.background = total > 0
      ? `conic-gradient(${gradientStops.join(", ")})`
      : "var(--surface-soft)";
    elements.dashboardLegend.innerHTML = legendRows.join("");
    elements.dashboardGoals.innerHTML = monthlyIncome > 0
      ? goalRows.join("")
      : '<p class="empty-state">Defina sua renda mensal acima para ver quanto ainda pode gastar em cada categoria.</p>';
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  }

  function populateReportFilters() {
    const selectedPerson = elements.reportPersonFilter.value;
    const selectedYear = elements.reportYearFilter.value;

    const personIds = new Set([
      ...membersById.keys(),
      ...allExpenses.map((item) => item.user_id).filter(Boolean)
    ]);
    const people = [...personIds]
      .map((userId) => ({ userId, label: getMemberLabel(userId) }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

    elements.reportPersonFilter.innerHTML = [
      '<option value="">Todas as pessoas</option>',
      ...people.map(
        (person) => `<option value="${escapeHtml(person.userId)}">${escapeHtml(person.label)}</option>`
      )
    ].join("");

    if (people.some((person) => person.userId === selectedPerson)) {
      elements.reportPersonFilter.value = selectedPerson;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const years = [...new Set(
      allExpenses
        .map((item) => competenciaParts(item.competencia).year)
        .filter((year) => year > 0)
    )];
    if (!years.includes(currentYear)) years.push(currentYear);
    years.sort((a, b) => b - a);

    elements.reportYearFilter.innerHTML = [
      '<option value="">Todos os anos</option>',
      ...years.map((year) => `<option value="${year}">${year}</option>`)
    ].join("");

    if (!reportFiltersDefaulted) {
      reportFiltersDefaulted = true;
      elements.reportMonthFilter.value = String(now.getMonth() + 1);
      elements.reportYearFilter.value = String(currentYear);
      return;
    }

    elements.reportYearFilter.value = years.some((year) => String(year) === selectedYear)
      ? selectedYear
      : "";
  }

  function getReportFilteredExpenses() {
    const selectedPerson = elements.reportPersonFilter.value;
    const selectedCategory = elements.reportCategoryFilter.value;
    const selectedForma = elements.reportFormaFilter.value;
    const selectedMonth = Number(elements.reportMonthFilter.value || 0);
    const selectedYear = Number(elements.reportYearFilter.value || 0);
    const searchTerm = normalizeSearchText(elements.reportSearch.value.trim());

    return allExpenses.filter((item) => {
      if (selectedPerson && item.user_id !== selectedPerson) return false;
      if (selectedForma && item.forma !== selectedForma) return false;

      const category = item.orcamento || "Sem categoria";
      if (selectedCategory && category !== selectedCategory) return false;

      const { year: compYear, month: compMonth } = competenciaParts(item.competencia);
      if (!compYear || !compMonth) {
        if (selectedMonth || selectedYear) return false;
      } else {
        if (selectedMonth && compMonth !== selectedMonth) return false;
        if (selectedYear && compYear !== selectedYear) return false;
      }

      if (searchTerm) {
        const haystack = normalizeSearchText(`${item.gasto} ${item.observacao || ""}`);
        if (!haystack.includes(searchTerm)) return false;
      }

      return true;
    });
  }

  function renderReport() {
    const items = getReportFilteredExpenses();
    const total = items.reduce((sum, item) => sum + Number(item.valor || 0), 0);

    elements.reportCount.textContent = `${items.length} ${items.length === 1 ? "lançamento" : "lançamentos"}`;
    elements.reportTotal.textContent = moneyFormatter.format(total);

    if (!items.length) {
      elements.reportGroups.innerHTML =
        '<p class="empty-state">Nenhum lançamento encontrado para os filtros selecionados.</p>';
      return;
    }

    const groups = new Map();
    for (const item of items) {
      const category = item.orcamento || "Sem categoria";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(item);
    }

    const knownOrder = CATEGORY_TARGETS.map(([name]) => name);
    const orderedCategories = [
      ...knownOrder.filter((name) => groups.has(name)),
      ...[...groups.keys()].filter((name) => !knownOrder.includes(name))
    ];

    elements.reportGroups.innerHTML = orderedCategories
      .map((category) => {
        const groupItems = groups.get(category)
          .slice()
          .sort((a, b) => new Date(b.ocorrido_em) - new Date(a.ocorrido_em));
        const subtotal = groupItems.reduce((sum, item) => sum + Number(item.valor || 0), 0);
        const color = CATEGORY_COLORS[category] || "var(--muted)";

        const rows = groupItems
          .map((item) => {
            const date = new Date(item.data_compra || item.ocorrido_em);
            const formattedDate = Number.isNaN(date.getTime())
              ? "Data inválida"
              : dateFormatter.format(date);
            const installments = Number(item.parcela_total) > 1
              ? ` · ${Number(item.parcela_num || 1)}/${Number(item.parcela_total)}`
              : "";
            const note = item.observacao
              ? `<p class="report-row-note">${escapeHtml(item.observacao)}</p>`
              : "";

            return `
              <div class="report-row">
                <div class="report-row-main">
                  <span class="report-row-name">${escapeHtml(item.gasto)}</span>
                  <span class="report-row-meta">${escapeHtml(getMemberLabel(item.user_id))} · ${escapeHtml(item.forma)}${installments} · ${escapeHtml(formattedDate)}</span>
                  ${note}
                </div>
                <span class="report-row-value">${moneyFormatter.format(Number(item.valor))}</span>
              </div>`;
          })
          .join("");

        return `
          <section class="report-group">
            <header class="report-group-header" style="--group-color:${color}">
              <span class="report-group-dot"></span>
              <h3>${escapeHtml(category)}</h3>
              <span class="report-group-count">${groupItems.length} ${groupItems.length === 1 ? "item" : "itens"}</span>
              <strong class="report-group-total">${moneyFormatter.format(subtotal)}</strong>
            </header>
            <div class="report-group-rows">${rows}</div>
          </section>`;
      })
      .join("");
  }

  // ---- Cartão de crédito -------------------------------------------------
  function currentPurchaseDate() {
    if (elements.agora.checked || !elements.dateInput.value) return new Date();
    const parsed = new Date(elements.dateInput.value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  function updateFaturaField() {
    const isNubank = elements.forma.value === "NUBANK";
    elements.faturaField.classList.toggle("hidden", !isNubank);
    if (!isNubank) return;

    const cfg = cardConfig || DEFAULT_CARD_CONFIG;

    if (!faturaManual) {
      const iso = competenciaFromPurchase(currentPurchaseDate(), cfg.dia_fechamento, cfg.dia_vencimento);
      const { year, month } = competenciaParts(iso);
      elements.faturaInput.value = `${year}-${String(month).padStart(2, "0")}`;
    }

    elements.faturaReset.classList.toggle("hidden", !faturaManual);
    elements.faturaHint.textContent = faturaManual
      ? "Fatura definida manualmente."
      : `Calculada pelo fechamento dia ${cfg.dia_fechamento} e vencimento dia ${cfg.dia_vencimento}.`;
  }

  function updateInstallmentHint() {
    const isNubank = elements.forma.value === "NUBANK";
    const parcelaTotal = Number(elements.parcelas.value || 1);
    const total = parseMoney(elements.valor.value);

    if (isNubank && parcelaTotal > 1 && Number.isFinite(total) && total > 0) {
      const base = Math.round((total / parcelaTotal) * 100) / 100;
      elements.installmentHint.textContent =
        `${moneyFormatter.format(total)} no total — ${parcelaTotal}x de ${moneyFormatter.format(base)}, lançadas mês a mês na fatura.`;
      elements.installmentHint.classList.remove("hidden");
    } else {
      elements.installmentHint.textContent = "";
      elements.installmentHint.classList.add("hidden");
    }
  }

  function renderCard() {
    if (!cardCompetencia) cardCompetencia = competenciaMonthISO(new Date());

    const cfg = cardConfig || DEFAULT_CARD_CONFIG;
    const { month } = competenciaParts(cardCompetencia);

    elements.cardConfigSummary.textContent =
      `Fecha dia ${cfg.dia_fechamento} · vence dia ${cfg.dia_vencimento}`;
    elements.cardPeriod.textContent = competenciaLabel(cardCompetencia);
    elements.cardCycleInfo.textContent =
      `Fecha ${String(cfg.dia_fechamento).padStart(2, "0")}/${String(month).padStart(2, "0")}` +
      ` · vence ${String(cfg.dia_vencimento).padStart(2, "0")}/${String(month).padStart(2, "0")}`;

    const purchases = allExpenses
      .filter((item) => item.forma === "NUBANK" && sameCompetencia(item.competencia, cardCompetencia))
      .slice()
      .sort((a, b) =>
        new Date(b.data_compra || b.ocorrido_em) - new Date(a.data_compra || a.ocorrido_em));

    let comprasTotal = purchases.reduce((sum, item) => sum + Number(item.valor || 0), 0);

    const saldoInicial = Number(cfg.saldo_inicial || 0);
    const saldoAplica = saldoInicial > 0 && sameCompetencia(cfg.saldo_inicial_competencia, cardCompetencia);
    if (saldoAplica) comprasTotal += saldoInicial;

    const pagamentos = cardPayments
      .filter((payment) => sameCompetencia(payment.competencia, cardCompetencia))
      .slice()
      .sort((a, b) => new Date(b.pago_em) - new Date(a.pago_em));
    const pagoTotal = pagamentos.reduce((sum, payment) => sum + Number(payment.valor || 0), 0);

    const emAberto = Math.round((comprasTotal - pagoTotal) * 100) / 100;
    cardEmAberto = emAberto;

    elements.cardTotal.textContent = moneyFormatter.format(comprasTotal);
    elements.cardPaid.textContent = moneyFormatter.format(pagoTotal);
    elements.cardOpen.textContent = emAberto > 0.005
      ? moneyFormatter.format(emAberto)
      : `${moneyFormatter.format(Math.max(0, emAberto))} · quitada`;
    elements.cardOpen.classList.toggle("pending", emAberto > 0.005);

    const referencia = competenciaMonthISO(new Date());
    const futuras = allExpenses.filter(
      (item) => item.forma === "NUBANK" && competenciaIsAfter(item.competencia, referencia)
    );
    const futuroTotal = futuras.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const mesesFuturos = new Set(futuras.map((item) => item.competencia)).size;

    elements.cardFutureTotal.textContent = moneyFormatter.format(futuroTotal);
    elements.cardFutureDetail.textContent = futuras.length
      ? `${futuras.length} ${futuras.length === 1 ? "parcela" : "parcelas"} em ` +
        `${mesesFuturos} ${mesesFuturos === 1 ? "mês" : "meses"}`
      : "Nada lançado para os próximos meses.";

    elements.cardPaymentsList.innerHTML = pagamentos.length
      ? pagamentos
          .map((payment) => {
            const paidDate = new Date(payment.pago_em);
            const dateLabel = Number.isNaN(paidDate.getTime())
              ? "Data inválida"
              : dateOnlyFormatter.format(paidDate);
            const note = payment.observacao ? ` · ${escapeHtml(payment.observacao)}` : "";
            return `
              <div class="card-payment-item">
                <div>
                  <strong>${moneyFormatter.format(Number(payment.valor || 0))}</strong>
                  <span>${escapeHtml(dateLabel)}${note}</span>
                </div>
                <button type="button" class="expense-action-button danger" data-payment-id="${escapeHtml(payment.id)}">
                  <span>Excluir</span>
                </button>
              </div>`;
          })
          .join("")
      : '<p class="empty-state">Nenhum pagamento registrado para esta fatura.</p>';

    const saldoRow = saldoAplica
      ? `
        <div class="report-row">
          <div class="report-row-main">
            <span class="report-row-name">Saldo inicial da fatura</span>
            <span class="report-row-meta">Dívida lançada como saldo de abertura</span>
          </div>
          <span class="report-row-value">${moneyFormatter.format(saldoInicial)}</span>
        </div>`
      : "";

    const purchaseRows = purchases
      .map((item) => {
        const purchaseDate = new Date(item.data_compra || item.ocorrido_em);
        const dateLabel = Number.isNaN(purchaseDate.getTime())
          ? "Data inválida"
          : dateOnlyFormatter.format(purchaseDate);
        const parcela = Number(item.parcela_total) > 1
          ? ` · ${Number(item.parcela_num || 1)}/${Number(item.parcela_total)}`
          : "";
        return `
          <div class="report-row">
            <div class="report-row-main">
              <span class="report-row-name">${escapeHtml(item.gasto)}</span>
              <span class="report-row-meta">${escapeHtml(getMemberLabel(item.user_id))}${parcela} · compra ${escapeHtml(dateLabel)} · ${escapeHtml(item.orcamento || "Sem categoria")}</span>
            </div>
            <span class="report-row-value">${moneyFormatter.format(Number(item.valor || 0))}</span>
          </div>`;
      })
      .join("");

    elements.cardPurchasesList.innerHTML = (saldoRow + purchaseRows) ||
      '<p class="empty-state">Nenhuma compra no crédito nesta fatura.</p>';
  }

  function showCardConfigEdit(show) {
    elements.cardConfigDisplay.classList.toggle("hidden", show);
    elements.cardConfigEdit.classList.toggle("hidden", !show);
    if (!show) return;

    const cfg = cardConfig || DEFAULT_CARD_CONFIG;
    elements.cardClosingInput.value = cfg.dia_fechamento;
    elements.cardDueInput.value = cfg.dia_vencimento;
    elements.cardInitialInput.value = Number(cfg.saldo_inicial) > 0
      ? Number(cfg.saldo_inicial).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";
    const parts = competenciaParts(cfg.saldo_inicial_competencia);
    elements.cardInitialMonthInput.value = parts.year && parts.month
      ? `${parts.year}-${String(parts.month).padStart(2, "0")}`
      : "";
  }

  async function saveCardConfig() {
    if (!supabaseClient || !currentSession) return;
    if (!navigator.onLine) {
      showToast("Sem internet: não é possível salvar a configuração agora.");
      return;
    }

    const closing = Number(elements.cardClosingInput.value);
    const due = Number(elements.cardDueInput.value);

    if (!Number.isInteger(closing) || closing < 1 || closing > 28) {
      showToast("Dia de fechamento inválido (use um número de 1 a 28).");
      return;
    }
    if (!Number.isInteger(due) || due < 1 || due > 28) {
      showToast("Dia de vencimento inválido (use um número de 1 a 28).");
      return;
    }

    const saldoParsed = parseMoney(elements.cardInitialInput.value);
    const saldoInicial = Number.isFinite(saldoParsed) && saldoParsed > 0 ? saldoParsed : 0;
    const monthValue = elements.cardInitialMonthInput.value;
    const saldoComp = saldoInicial > 0 && monthValue ? `${monthValue}-01` : null;

    setLoading(elements.saveCardConfigButton, true, "Salvando...", "Salvar");

    try {
      const { error } = await supabaseClient
        .from("configuracoes_cartao")
        .update({
          dia_fechamento: closing,
          dia_vencimento: due,
          saldo_inicial: saldoInicial,
          saldo_inicial_competencia: saldoComp,
          atualizado_em: new Date().toISOString()
        })
        .eq("id", true);

      if (error) throw error;

      cardConfig = {
        dia_fechamento: closing,
        dia_vencimento: due,
        saldo_inicial: saldoInicial,
        saldo_inicial_competencia: saldoComp
      };
      showCardConfigEdit(false);
      renderCard();
      updateFaturaField();
      showToast("Configuração do cartão salva.");
    } catch (error) {
      console.error("Erro ao salvar a configuração do cartão:", error);
      showToast(`Não foi possível salvar: ${error?.message || "erro desconhecido"}`);
    } finally {
      setLoading(elements.saveCardConfigButton, false, "Salvando...", "Salvar");
    }
  }

  function showPaymentForm(show) {
    elements.cardPaymentForm.classList.toggle("hidden", !show);
    elements.cardPaymentToggle.classList.toggle("hidden", show);
    if (!show) return;

    const cfg = cardConfig || DEFAULT_CARD_CONFIG;
    const { year, month } = competenciaParts(cardCompetencia);
    const dueDay = Math.min(28, Math.max(1, Number(cfg.dia_vencimento || 10)));

    elements.cardPaymentDate.value =
      `${year}-${String(month).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;
    elements.cardPaymentValue.value = cardEmAberto > 0.005
      ? cardEmAberto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";
    elements.cardPaymentObs.value = "";
    window.setTimeout(() => elements.cardPaymentValue.focus(), 0);
  }

  async function savePayment() {
    if (!supabaseClient || !currentSession) return;
    if (!navigator.onLine) {
      showToast("Sem internet: não é possível registrar o pagamento agora.");
      return;
    }

    const valor = parseMoney(elements.cardPaymentValue.value);
    if (!Number.isFinite(valor) || valor <= 0) {
      showToast("Informe um valor de pagamento válido.");
      return;
    }

    const [py, pm, pd] = String(elements.cardPaymentDate.value || "").split("-").map(Number);
    if (!py || !pm || !pd) {
      showToast("Informe a data do pagamento.");
      return;
    }
    const pagoEm = new Date(py, pm - 1, pd, 12, 0, 0);

    setLoading(elements.cardPaymentSave, true, "Salvando...", "Salvar pagamento");

    try {
      const { error } = await supabaseClient.from("pagamentos_cartao").insert({
        competencia: cardCompetencia,
        valor,
        pago_em: pagoEm.toISOString(),
        observacao: elements.cardPaymentObs.value.trim() || null
      });

      if (error) throw error;

      historyNeedsRefresh = true;
      await loadRecent();
      showPaymentForm(false);
      showToast("Pagamento da fatura registrado.");
    } catch (error) {
      console.error("Erro ao registrar pagamento da fatura:", error);
      showToast(`Não foi possível salvar: ${error?.message || "erro desconhecido"}`);
    } finally {
      setLoading(elements.cardPaymentSave, false, "Salvando...", "Salvar pagamento");
    }
  }

  function handleCardPaymentsClick(event) {
    const button = event.target.closest("[data-payment-id]");
    if (!button) return;
    void deletePayment(button.dataset.paymentId);
  }

  async function deletePayment(paymentId) {
    if (!navigator.onLine) {
      showToast("Sem internet: não é possível excluir agora.");
      return;
    }

    const confirmed = await askConfirmation("Excluir este pagamento da fatura?");
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient.from("pagamentos_cartao").delete().eq("id", paymentId);
      if (error) throw error;

      cardPayments = cardPayments.filter((payment) => String(payment.id) !== String(paymentId));
      renderCard();
      showToast("Pagamento excluído.");
    } catch (error) {
      console.error("Erro ao excluir pagamento:", error);
      showToast(`Não foi possível excluir: ${error?.message || "erro desconhecido"}`);
    }
  }

  async function fetchAllExpenses() {
    const pageSize = 1000;
    const items = [];
    let start = 0;

    while (true) {
      const { data, error } = await supabaseClient
        .from("gastos")
        .select("id,user_id,gasto,valor,forma,parcelas,orcamento,ocorrido_em,observacao,data_compra,competencia,grupo_parcelamento,parcela_num,parcela_total")
        .order("ocorrido_em", { ascending: false })
        .range(start, start + pageSize - 1);

      if (error) throw error;
      items.push(...(data || []));

      if (!data || data.length < pageSize) break;
      start += pageSize;
    }

    return items;
  }

  async function loadRecent() {
    if (!supabaseClient || !currentSession) return;

    elements.refreshButton.disabled = true;
    elements.recentList.setAttribute("aria-busy", "true");

    try {
      const [membersResult, expenses, cardConfigResult, cardPaymentsResult] = await Promise.all([
        supabaseClient
          .from("membros_casal")
          .select("user_id,nome,email")
          .order("nome", { ascending: true }),
        fetchAllExpenses(),
        supabaseClient
          .from("configuracoes_cartao")
          .select("dia_fechamento,dia_vencimento,saldo_inicial,saldo_inicial_competencia")
          .eq("id", true)
          .maybeSingle(),
        supabaseClient
          .from("pagamentos_cartao")
          .select("id,user_id,competencia,valor,pago_em,observacao")
          .order("pago_em", { ascending: false })
      ]);

      if (membersResult.error) throw membersResult.error;
      if (cardConfigResult.error) throw cardConfigResult.error;
      if (cardPaymentsResult.error) throw cardPaymentsResult.error;

      membersById = new Map(
        (membersResult.data || []).map((member) => [member.user_id, member])
      );
      allExpenses = (expenses || []).map((item) => ({
        ...item,
        competencia: item.competencia || competenciaMonthISO(item.ocorrido_em)
      }));
      cardConfig = cardConfigResult.data
        ? { ...DEFAULT_CARD_CONFIG, ...cardConfigResult.data }
        : { ...DEFAULT_CARD_CONFIG };
      cardPayments = cardPaymentsResult.data || [];

      populateHistoryFilters();
      applyHistoryFilters();
      populateDashboardFilters();
      renderDashboard();
      populateReportFilters();
      renderReport();
      renderCard();
      updateFaturaField();
      historyNeedsRefresh = false;
    } catch (error) {
      elements.recentList.innerHTML = `<p class="empty-state">Não foi possível carregar: ${escapeHtml(
        error?.message || "erro desconhecido"
      )}</p>`;
      updateHistorySummary([]);
    } finally {
      elements.refreshButton.disabled = false;
      elements.recentList.removeAttribute("aria-busy");
    }
  }

  function getLastForma() {
    try {
      const value = localStorage.getItem(LAST_FORMA_KEY);
      return ALLOWED_PAYMENT_METHODS.has(value) ? value : "PIX";
    } catch {
      return "PIX";
    }
  }

  function getLastOrcamento() {
    try {
      const value = localStorage.getItem(LAST_ORCAMENTO_KEY);
      return ALLOWED_BUDGET_CATEGORIES.has(value) ? value : "";
    } catch {
      return "";
    }
  }

  function rememberLastChoice(forma, orcamento) {
    try {
      localStorage.setItem(LAST_FORMA_KEY, forma);
      localStorage.setItem(LAST_ORCAMENTO_KEY, orcamento);
    } catch {
      // A lembrança da última escolha é apenas uma conveniência.
    }
  }

  async function loadGastoSuggestions() {
    if (!supabaseClient || !currentSession) return;

    try {
      const { data, error } = await supabaseClient
        .from("gastos")
        .select("gasto")
        .order("ocorrido_em", { ascending: false })
        .limit(300);

      if (error) throw error;

      const frequency = new Map();
      for (const item of data || []) {
        const name = String(item.gasto || "").trim();
        if (!name) continue;
        frequency.set(name, (frequency.get(name) || 0) + 1);
      }

      const names = [...frequency.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
        .slice(0, 30);

      elements.gastoSuggestions.innerHTML = names
        .map((name) => `<option value="${escapeHtml(name)}"></option>`)
        .join("");
    } catch (error) {
      console.warn("Não foi possível carregar sugestões de gasto:", error);
    }
  }

  function showIncomeEdit(show) {
    elements.dashboardIncomeDisplay.classList.toggle("hidden", show);
    elements.dashboardIncomeEdit.classList.toggle("hidden", !show);

    if (show) {
      elements.dashboardIncomeInput.value = monthlyIncome > 0
        ? monthlyIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "";
      window.setTimeout(() => elements.dashboardIncomeInput.focus(), 0);
    }
  }

  async function loadMonthlyIncome() {
    if (!supabaseClient || !currentSession) return;

    try {
      const { data, error } = await supabaseClient
        .from("configuracoes_orcamento")
        .select("renda_mensal")
        .eq("id", true)
        .maybeSingle();

      if (error) throw error;

      monthlyIncome = Number(data?.renda_mensal || 0);
    } catch (error) {
      console.warn("Não foi possível carregar a renda mensal:", error);
    } finally {
      elements.dashboardIncomeValue.textContent = moneyFormatter.format(monthlyIncome);
      renderDashboard();
    }
  }

  async function saveMonthlyIncome() {
    const value = parseMoney(elements.dashboardIncomeInput.value);

    if (!Number.isFinite(value) || value < 0) {
      showToast("Informe um valor de renda válido.");
      return;
    }

    setLoading(elements.saveIncomeButton, true, "Salvando...", "Salvar");

    try {
      const { error } = await supabaseClient
        .from("configuracoes_orcamento")
        .update({ renda_mensal: value, atualizado_em: new Date().toISOString() })
        .eq("id", true);

      if (error) throw error;

      monthlyIncome = value;
      elements.dashboardIncomeValue.textContent = moneyFormatter.format(monthlyIncome);
      showIncomeEdit(false);
      renderDashboard();
      showToast("Renda mensal atualizada.");
    } catch (error) {
      console.error("Erro ao salvar a renda mensal:", error);
      showToast(`Não foi possível salvar: ${error?.message || "erro desconhecido"}`);
    } finally {
      setLoading(elements.saveIncomeButton, false, "Salvando...", "Salvar");
    }
  }

  function getOfflineQueue() {
    try {
      const parsed = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveOfflineQueue(queue) {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  function queueOfflineExpense(payload) {
    const queue = getOfflineQueue();
    queue.push({
      ownerUserId: currentSession?.user?.id || null,
      payload
    });
    saveOfflineQueue(queue);
  }

  async function flushOfflineQueue() {
    if (!navigator.onLine || !supabaseClient || !currentSession?.user?.id) return;

    const queue = getOfflineQueue();
    if (!queue.length) return;

    const remaining = [];
    let sent = 0;

    for (const item of queue) {
      if (item.ownerUserId && item.ownerUserId !== currentSession.user.id) {
        remaining.push(item);
        continue;
      }

      const normalizedPayload = {
        ...item.payload,
        parcelas: item.payload.forma === "NUBANK"
          ? Math.min(12, Math.max(1, Number(item.payload.parcelas || 1)))
          : 0
      };

      const { error } = await supabaseClient.from("gastos").insert(normalizedPayload);

      if (!error || error.code === "23505") {
        sent += 1;
      } else {
        remaining.push(item);
      }
    }

    saveOfflineQueue(remaining);

    if (sent > 0) {
      historyNeedsRefresh = true;
      showToast(`${sent} gasto(s) pendente(s) enviado(s).`);

      if (activeScreen === "history") {
        await loadRecent();
      }
    }
  }

  function resetExpenseForm() {
    elements.expenseForm.reset();
    elements.agora.checked = true;
    elements.forma.value = getLastForma();
    elements.parcelas.value = "1";
    elements.orcamento.value = getLastOrcamento();
    faturaManual = false;
    elements.faturaInput.value = "";
    toggleInstallmentsField();
    toggleDateField();
    updateFaturaField();
    updateInstallmentHint();
    elements.gasto.focus();
  }

  function exitEditMode() {
    editingExpenseId = null;
    elements.editBanner.classList.add("hidden");
    elements.saveButton.textContent = "Salvar gasto";
  }

  function enterEditMode(item) {
    editingExpenseId = item.id;

    elements.gasto.value = item.gasto || "";
    elements.valor.value = Number(item.valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    elements.forma.value = ALLOWED_PAYMENT_METHODS.has(item.forma) ? item.forma : "PIX";
    toggleInstallmentsField();
    if (elements.forma.value === "NUBANK") {
      elements.parcelas.value = String(Math.min(12, Math.max(1, Number(item.parcelas || 1))));
    }
    elements.orcamento.value = ALLOWED_BUDGET_CATEGORIES.has(item.orcamento) ? item.orcamento : "";
    elements.observacao.value = item.observacao || "";

    const occurredAt = new Date(item.data_compra || item.ocorrido_em);
    elements.agora.checked = false;
    elements.dateInput.value = Number.isNaN(occurredAt.getTime())
      ? toLocalDateTimeValue()
      : toLocalDateTimeValue(occurredAt);
    toggleDateField();

    faturaManual = true;
    const editComp = competenciaParts(item.competencia);
    elements.faturaInput.value = editComp.year && editComp.month
      ? `${editComp.year}-${String(editComp.month).padStart(2, "0")}`
      : "";
    updateFaturaField();
    updateInstallmentHint();

    elements.editBanner.classList.remove("hidden");
    elements.saveButton.textContent = "Atualizar gasto";
    setMessage(elements.expenseMessage);

    showAppScreen("entry");
    window.setTimeout(() => elements.gasto.focus({ preventScroll: true }), 0);
  }

  function askConfirmation(message) {
    return new Promise((resolve) => {
      elements.confirmMessage.textContent = message;
      elements.confirmOverlay.classList.remove("hidden");

      const finish = (result) => {
        elements.confirmOverlay.classList.add("hidden");
        elements.confirmCancelButton.removeEventListener("click", onCancel);
        elements.confirmOkButton.removeEventListener("click", onConfirm);
        resolve(result);
      };
      const onCancel = () => finish(false);
      const onConfirm = () => finish(true);

      elements.confirmCancelButton.addEventListener("click", onCancel);
      elements.confirmOkButton.addEventListener("click", onConfirm);
    });
  }

  async function deleteExpense(item) {
    if (!navigator.onLine) {
      showToast("Sem internet: não é possível excluir agora.");
      return;
    }

    const label = `${item.gasto} (${moneyFormatter.format(Number(item.valor || 0))})`;
    const confirmed = await askConfirmation(
      `Excluir o lançamento "${label}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient.from("gastos").delete().eq("id", item.id);
      if (error) throw error;

      allExpenses = allExpenses.filter((expense) => expense.id !== item.id);
      populateHistoryFilters();
      applyHistoryFilters();
      populateDashboardFilters();
      renderDashboard();
      populateReportFilters();
      renderReport();

      if (editingExpenseId === item.id) {
        exitEditMode();
      }

      showToast("Gasto excluído.");
    } catch (error) {
      console.error("Erro ao excluir gasto:", error);
      showToast(`Não foi possível excluir: ${error?.message || "erro desconhecido"}`);
    }
  }

  function handleHistoryListClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const item = allExpenses.find((expense) => String(expense.id) === button.dataset.id);
    if (!item) return;

    if (button.dataset.action === "edit") {
      enterEditMode(item);
    } else if (button.dataset.action === "delete") {
      void deleteExpense(item);
    }
  }

  async function applySession(session) {
    const renderToken = ++authRenderToken;
    currentSession = session || null;
    const authenticated = Boolean(currentSession?.user);

    setAuthenticatedView(authenticated);

    if (!authenticated) {
      elements.signedUser.textContent = "";
      elements.recentList.innerHTML =
        '<p class="empty-state">Nenhum lançamento carregado.</p>';
      allExpenses = [];
      membersById = new Map();
      updateHistorySummary([]);
      elements.categorySummary.classList.add("hidden");
      elements.categorySummary.innerHTML = "";
      elements.gastoSuggestions.innerHTML = "";
      exitEditMode();
      filtersDefaulted = false;
      dashboardFiltersDefaulted = false;
      reportFiltersDefaulted = false;
      selectedCategoryFilter = "";
      monthlyIncome = 0;
      elements.dashboardIncomeValue.textContent = moneyFormatter.format(0);
      showIncomeEdit(false);
      cardConfig = null;
      cardPayments = [];
      cardCompetencia = "";
      cardEmAberto = 0;
      faturaManual = false;
      showCardConfigEdit(false);
      showPaymentForm(false);
      historyNeedsRefresh = true;
      renderDashboard();
      renderReport();
      renderCard();
      showAppScreen("entry");
      return;
    }

    elements.signedUser.textContent = currentSession.user.email
      ? `Conectado como ${currentSession.user.email}`
      : "Usuário conectado";

    showAppScreen("entry");

    await flushOfflineQueue();
    if (renderToken !== authRenderToken) return;
    historyNeedsRefresh = true;
    void loadGastoSuggestions();
    void loadMonthlyIncome();
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage(elements.loginMessage);

    const email = elements.email.value.trim().toLowerCase();
    const password = elements.password.value;

    if (!email || !password) {
      setMessage(elements.loginMessage, "Preencha o e-mail e a senha.", "error");
      return;
    }

    setLoading(elements.loginButton, true, "Entrando...", "Entrar");

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data?.session) {
        throw new Error("O login não retornou uma sessão válida.");
      }

      elements.password.value = "";
      setMessage(elements.loginMessage);
      await applySession(data.session);
    } catch (error) {
      console.error("Erro completo do Supabase no login:", error);
      setMessage(elements.loginMessage, formatAuthError(error), "error");
    } finally {
      setLoading(elements.loginButton, false, "Entrando...", "Entrar");
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage(elements.expenseMessage);

    if (!currentSession?.user) {
      setMessage(elements.expenseMessage, "Sua sessão expirou. Entre novamente.", "error");
      await supabaseClient.auth.signOut({ scope: "local" });
      return;
    }

    const gasto = elements.gasto.value.trim();
    const valor = parseMoney(elements.valor.value);
    const forma = elements.forma.value;
    const parcelas = forma === "NUBANK" ? Number(elements.parcelas.value) : 0;
    const orcamento = elements.orcamento.value;
    const observacao = elements.observacao.value.trim();

    if (!gasto) {
      setMessage(elements.expenseMessage, "Informe o nome do gasto.", "error");
      elements.gasto.focus();
      return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      setMessage(elements.expenseMessage, "Informe um valor maior que zero.", "error");
      elements.valor.focus();
      return;
    }

    if (!ALLOWED_PAYMENT_METHODS.has(forma)) {
      setMessage(elements.expenseMessage, "Selecione uma forma de pagamento válida.", "error");
      elements.forma.focus();
      return;
    }

    if (forma === "NUBANK" && (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 12)) {
      setMessage(elements.expenseMessage, "Selecione um número de parcelas entre 1 e 12.", "error");
      elements.parcelas.focus();
      return;
    }

    if (!ALLOWED_BUDGET_CATEGORIES.has(orcamento)) {
      setMessage(elements.expenseMessage, "Selecione uma categoria de orçamento.", "error");
      elements.orcamento.focus();
      return;
    }

    let occurredAt = new Date();

    if (!elements.agora.checked) {
      if (!elements.dateInput.value) {
        setMessage(elements.expenseMessage, "Informe a data e a hora do gasto.", "error");
        elements.dateInput.focus();
        return;
      }

      occurredAt = new Date(elements.dateInput.value);
      if (Number.isNaN(occurredAt.getTime())) {
        setMessage(elements.expenseMessage, "A data informada é inválida.", "error");
        return;
      }
    }

    const isNubank = forma === "NUBANK";
    const parcelaTotal = isNubank ? Math.min(12, Math.max(1, parcelas)) : 1;

    let competencia1;
    if (isNubank && faturaManual && elements.faturaInput.value) {
      competencia1 = `${elements.faturaInput.value}-01`;
    } else if (isNubank) {
      const cfg = cardConfig || DEFAULT_CARD_CONFIG;
      competencia1 = competenciaFromPurchase(occurredAt, cfg.dia_fechamento, cfg.dia_vencimento);
    } else {
      competencia1 = competenciaMonthISO(occurredAt);
    }

    const basePayload = {
      gasto,
      valor,
      forma,
      parcelas,
      orcamento,
      ocorrido_em: occurredAt.toISOString(),
      data_compra: occurredAt.toISOString(),
      observacao: observacao || null
    };

    if (editingExpenseId) {
      if (!navigator.onLine) {
        setMessage(
          elements.expenseMessage,
          "Sem internet: não é possível atualizar agora. Tente novamente quando a conexão voltar.",
          "error"
        );
        return;
      }

      const editingId = editingExpenseId;
      const editPayload = { ...basePayload, competencia: competencia1 };
      setLoading(elements.saveButton, true, "Atualizando...", "Atualizar gasto");

      try {
        const { error } = await supabaseClient.from("gastos").update(editPayload).eq("id", editingId);
        if (error) throw error;

        allExpenses = allExpenses.map((expense) =>
          expense.id === editingId ? { ...expense, ...editPayload } : expense
        );
        rememberLastChoice(forma, orcamento);
        populateHistoryFilters();
        applyHistoryFilters();
        populateDashboardFilters();
        renderDashboard();
        populateReportFilters();
        renderReport();
        renderCard();

        exitEditMode();
        resetExpenseForm();
        showToast("Gasto atualizado!");
        showAppScreen("history");
      } catch (error) {
        console.error("Erro ao atualizar gasto:", error);
        setMessage(
          elements.expenseMessage,
          `Não foi possível atualizar. ${error?.message || "Erro desconhecido."}`,
          "error"
        );
      } finally {
        setLoading(elements.saveButton, false, "Atualizando...", "Atualizar gasto");
      }
      return;
    }

    if (isNubank && parcelaTotal > 1) {
      if (!navigator.onLine) {
        setMessage(
          elements.expenseMessage,
          "Sem internet: compras parceladas precisam de conexão. Tente de novo quando a internet voltar.",
          "error"
        );
        return;
      }

      const grupo = randomUuid();
      const baseParcela = Math.round((valor / parcelaTotal) * 100) / 100;
      const rows = [];
      for (let numero = 1; numero <= parcelaTotal; numero += 1) {
        const parcelaValor = numero === parcelaTotal
          ? Math.round((valor - baseParcela * (parcelaTotal - 1)) * 100) / 100
          : baseParcela;
        rows.push({
          gasto,
          valor: parcelaValor,
          forma,
          parcelas: parcelaTotal,
          orcamento,
          ocorrido_em: occurredAt.toISOString(),
          data_compra: occurredAt.toISOString(),
          competencia: addMonthsISO(competencia1, numero - 1),
          grupo_parcelamento: grupo,
          parcela_num: numero,
          parcela_total: parcelaTotal,
          observacao: observacao || null,
          client_id: randomUuid()
        });
      }

      setLoading(elements.saveButton, true, "Salvando...", "Salvar gasto");

      try {
        const { error } = await supabaseClient.from("gastos").insert(rows);
        if (error) throw error;

        rememberLastChoice(forma, orcamento);
        resetExpenseForm();
        historyNeedsRefresh = true;
        setMessage(
          elements.expenseMessage,
          `Compra em ${parcelaTotal}x registrada: ${moneyFormatter.format(baseParcela)} por mês na fatura.`,
          "success"
        );
        showToast(`Compra parcelada em ${parcelaTotal}x registrada!`);
      } catch (error) {
        console.error("Erro ao salvar compra parcelada:", error);
        setMessage(
          elements.expenseMessage,
          `Não foi possível salvar. ${error?.message || "Erro desconhecido."}`,
          "error"
        );
      } finally {
        setLoading(elements.saveButton, false, "Salvando...", "Salvar gasto");
      }
      return;
    }

    const payload = {
      ...basePayload,
      competencia: competencia1,
      parcela_num: 1,
      parcela_total: 1,
      client_id: randomUuid()
    };

    if (!navigator.onLine) {
      queueOfflineExpense(payload);
      resetExpenseForm();
      setMessage(elements.expenseMessage, "Gasto guardado no aparelho para envio quando a internet voltar.", "success");
      showToast("Sem internet: gasto guardado no aparelho.");
      return;
    }

    setLoading(elements.saveButton, true, "Salvando...", "Salvar gasto");

    try {
      const { error } = await supabaseClient.from("gastos").insert(payload);
      if (error) throw error;

      rememberLastChoice(forma, orcamento);
      resetExpenseForm();
      historyNeedsRefresh = true;
      setMessage(elements.expenseMessage, "Gasto salvo com sucesso.", "success");
      showToast("Gasto registrado!");
    } catch (error) {
      console.error("Erro ao salvar gasto:", error);
      setMessage(
        elements.expenseMessage,
        `Não foi possível salvar. ${error?.message || "Erro desconhecido."}`,
        "error"
      );
    } finally {
      setLoading(elements.saveButton, false, "Salvando...", "Salvar gasto");
    }
  }

  async function removeOldServiceWorkersAndCaches() {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith("gastos-da-casa-"))
            .map((name) => caches.delete(name))
        );
      }
    } catch (error) {
      console.warn("Não foi possível limpar o cache antigo:", error);
    }
  }

  function configureDiagnostic() {
    const projectHost = (() => {
      try {
        return new URL(config.url).hostname;
      } catch {
        return "URL inválida";
      }
    })();

    const keyType = config.key.startsWith("sb_publishable_")
      ? "Publishable key"
      : config.key.startsWith("eyJ")
        ? "Anon key legada"
        : "Chave não reconhecida";

    elements.diagnosticMessage.textContent =
      `Aplicação ${APP_VERSION}\n` +
      `Projeto: ${projectHost}\n` +
      `Chave: ${keyType}\n` +
      "O erro completo do Supabase aparecerá acima caso o login falhe.";
  }

  async function init() {
    initializeTheme();
    await removeOldServiceWorkersAndCaches();

    elements.agora.addEventListener("change", toggleDateField);
    elements.agora.addEventListener("change", updateFaturaField);
    elements.dateInput.addEventListener("change", updateFaturaField);
    elements.forma.addEventListener("change", toggleInstallmentsField);
    elements.forma.addEventListener("change", updateFaturaField);
    elements.forma.addEventListener("change", updateInstallmentHint);
    elements.parcelas.addEventListener("change", updateInstallmentHint);
    elements.valor.addEventListener("blur", formatMoneyInput);
    elements.valor.addEventListener("blur", updateInstallmentHint);
    elements.faturaInput.addEventListener("input", () => {
      faturaManual = true;
      updateFaturaField();
    });
    elements.faturaReset.addEventListener("click", () => {
      faturaManual = false;
      updateFaturaField();
    });
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.expenseForm.addEventListener("submit", handleSave);
    elements.refreshButton.addEventListener("click", loadRecent);
    elements.personFilter.addEventListener("change", applyHistoryFilters);
    elements.monthFilter.addEventListener("change", applyHistoryFilters);
    elements.yearFilter.addEventListener("change", applyHistoryFilters);
    elements.openHistoryButton.addEventListener("click", () => showAppScreen("history"));
    elements.openDashboardButton.addEventListener("click", () => showAppScreen("dashboard"));
    elements.openReportButton.addEventListener("click", () => showAppScreen("report"));
    elements.openCardButton.addEventListener("click", () => showAppScreen("card"));
    elements.dashboardMonthFilter.addEventListener("change", renderDashboard);
    elements.dashboardYearFilter.addEventListener("change", renderDashboard);
    elements.editIncomeButton.addEventListener("click", () => showIncomeEdit(true));
    elements.cancelIncomeButton.addEventListener("click", () => showIncomeEdit(false));
    elements.saveIncomeButton.addEventListener("click", () => void saveMonthlyIncome());
    elements.dashboardIncomeInput.addEventListener("blur", formatMoneyInput);
    elements.reportSearch.addEventListener("input", renderReport);
    elements.reportPersonFilter.addEventListener("change", renderReport);
    elements.reportCategoryFilter.addEventListener("change", renderReport);
    elements.reportFormaFilter.addEventListener("change", renderReport);
    elements.reportMonthFilter.addEventListener("change", renderReport);
    elements.reportYearFilter.addEventListener("change", renderReport);
    elements.backEntryButton.addEventListener("click", () => showAppScreen("entry"));
    elements.backDashboardButton.addEventListener("click", () => showAppScreen("entry"));
    elements.backReportButton.addEventListener("click", () => showAppScreen("entry"));
    elements.backCardButton.addEventListener("click", () => showAppScreen("entry"));
    elements.cardPrevButton.addEventListener("click", () => {
      cardCompetencia = addMonthsISO(cardCompetencia || competenciaMonthISO(new Date()), -1);
      renderCard();
    });
    elements.cardNextButton.addEventListener("click", () => {
      cardCompetencia = addMonthsISO(cardCompetencia || competenciaMonthISO(new Date()), 1);
      renderCard();
    });
    elements.editCardConfigButton.addEventListener("click", () => showCardConfigEdit(true));
    elements.cancelCardConfigButton.addEventListener("click", () => showCardConfigEdit(false));
    elements.saveCardConfigButton.addEventListener("click", () => void saveCardConfig());
    elements.cardInitialInput.addEventListener("blur", formatMoneyInput);
    elements.cardPaymentToggle.addEventListener("click", () => showPaymentForm(true));
    elements.cardPaymentCancel.addEventListener("click", () => showPaymentForm(false));
    elements.cardPaymentSave.addEventListener("click", () => void savePayment());
    elements.cardPaymentValue.addEventListener("blur", formatMoneyInput);
    elements.cardPaymentsList.addEventListener("click", handleCardPaymentsClick);
    elements.recentList.addEventListener("click", handleHistoryListClick);
    elements.categorySummary.addEventListener("click", handleCategorySummaryClick);
    elements.cancelEditButton.addEventListener("click", () => {
      exitEditMode();
      resetExpenseForm();
    });
    elements.showPassword.addEventListener("change", () => {
      elements.password.type = elements.showPassword.checked ? "text" : "password";
    });
    window.addEventListener("online", () => {
      void flushOfflineQueue();
    });

    toggleInstallmentsField();
    toggleDateField();
    updateFaturaField();
    updateInstallmentHint();

    const configProblems = validateConfig();
    if (configProblems.length > 0) {
      setAuthenticatedView(false);
      setMessage(elements.loginMessage, configProblems.join("\n"), "error");
      elements.diagnosticMessage.textContent = configProblems.join("\n");
      elements.loginButton.disabled = true;
      return;
    }

    configureDiagnostic();

    supabaseClient = window.supabase.createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    elements.logoutButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        elements.logoutButtons.forEach((item) => { item.disabled = true; });
        const { error } = await supabaseClient.auth.signOut({ scope: "local" });
        elements.logoutButtons.forEach((item) => { item.disabled = false; });

        if (error) {
          showToast(`Não foi possível sair: ${error.message}`);
          return;
        }

        await applySession(null);
      });
    });

    // O callback não é async. As chamadas assíncronas são adiadas para evitar
    // travamentos conhecidos do cliente de autenticação do Supabase.
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void applySession(session);
      }, 0);
    });

    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      await applySession(data?.session || null);
    } catch (error) {
      console.error("Erro ao recuperar sessão:", error);
      await applySession(null);
      setMessage(
        elements.loginMessage,
        `Não foi possível recuperar a sessão. ${error?.message || "Erro desconhecido."}`,
        "error"
      );
    }
  }

  void init();
})();
