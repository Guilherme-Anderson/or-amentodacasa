(() => {
  "use strict";

  const APP_VERSION = "2.7.0";
  const OFFLINE_QUEUE_KEY = "gastos-da-casa-offline-v2";
  const THEME_STORAGE_KEY = "gastos-da-casa-theme";
  const LAST_FORMA_KEY = "gastos-da-casa-last-forma";
  const LAST_ORCAMENTO_KEY = "gastos-da-casa-last-orcamento";
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
    backEntryButton: document.querySelector("#back-entry-button"),
    backDashboardButton: document.querySelector("#back-dashboard-button"),
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
    saveIncomeButton: document.querySelector("#save-income-button")
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

  const moneyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });

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
    const target = screenName === "history" || screenName === "dashboard" ? screenName : "entry";
    activeScreen = target;

    elements.entryScreen.classList.toggle("hidden", target !== "entry");
    elements.historyScreen.classList.toggle("hidden", target !== "history");
    elements.dashboardScreen.classList.toggle("hidden", target !== "dashboard");

    if (target === "history" || target === "dashboard") {
      if (historyNeedsRefresh) {
        void loadRecent();
      } else if (target === "dashboard") {
        renderDashboard();
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
        .map((item) => new Date(item.ocorrido_em))
        .filter((date) => !Number.isNaN(date.getTime()))
        .map((date) => date.getFullYear())
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

  function getFilteredExpenses() {
    const selectedPerson = elements.personFilter.value;
    const selectedMonth = Number(elements.monthFilter.value || 0);
    const selectedYear = Number(elements.yearFilter.value || 0);

    return allExpenses.filter((item) => {
      if (selectedPerson && item.user_id !== selectedPerson) return false;

      const date = new Date(item.ocorrido_em);
      if (Number.isNaN(date.getTime())) return !selectedMonth && !selectedYear;
      if (selectedMonth && date.getMonth() + 1 !== selectedMonth) return false;
      if (selectedYear && date.getFullYear() !== selectedYear) return false;
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

        const date = new Date(item.ocorrido_em);
        const formattedDate = Number.isNaN(date.getTime())
          ? "Data inválida"
          : dateFormatter.format(date);

        const installments = item.forma === "NUBANK"
          ? ` · ${Number(item.parcelas || 1)}x`
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
        return `
          <div class="category-summary-row">
            <span class="bar" style="width:${percent}%"></span>
            <span>${escapeHtml(category)}</span>
            <strong>${moneyFormatter.format(value)}</strong>
          </div>`;
      })
      .join("");
  }

  function applyHistoryFilters() {
    const filtered = getFilteredExpenses();
    renderRecent(filtered);
    renderCategorySummary(filtered);
  }

  const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

  function populateDashboardFilters() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const selectedYear = elements.dashboardYearFilter.value;

    const years = [...new Set(
      allExpenses
        .map((item) => new Date(item.ocorrido_em))
        .filter((date) => !Number.isNaN(date.getTime()))
        .map((date) => date.getFullYear())
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
      const date = new Date(item.ocorrido_em);
      if (Number.isNaN(date.getTime())) return false;
      return date.getMonth() + 1 === month && date.getFullYear() === year;
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

  async function fetchAllExpenses() {
    const pageSize = 1000;
    const items = [];
    let start = 0;

    while (true) {
      const { data, error } = await supabaseClient
        .from("gastos")
        .select("id,user_id,gasto,valor,forma,parcelas,orcamento,ocorrido_em,observacao")
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
      const [membersResult, expenses] = await Promise.all([
        supabaseClient
          .from("membros_casal")
          .select("user_id,nome,email")
          .order("nome", { ascending: true }),
        fetchAllExpenses()
      ]);

      if (membersResult.error) throw membersResult.error;

      membersById = new Map(
        (membersResult.data || []).map((member) => [member.user_id, member])
      );
      allExpenses = expenses;
      populateHistoryFilters();
      applyHistoryFilters();
      populateDashboardFilters();
      renderDashboard();
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
    toggleInstallmentsField();
    toggleDateField();
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

    const occurredAt = new Date(item.ocorrido_em);
    elements.agora.checked = false;
    elements.dateInput.value = Number.isNaN(occurredAt.getTime())
      ? toLocalDateTimeValue()
      : toLocalDateTimeValue(occurredAt);
    toggleDateField();

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
      monthlyIncome = 0;
      elements.dashboardIncomeValue.textContent = moneyFormatter.format(0);
      showIncomeEdit(false);
      historyNeedsRefresh = true;
      renderDashboard();
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

    const basePayload = {
      gasto,
      valor,
      forma,
      parcelas,
      orcamento,
      ocorrido_em: occurredAt.toISOString(),
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
      setLoading(elements.saveButton, true, "Atualizando...", "Atualizar gasto");

      try {
        const { error } = await supabaseClient.from("gastos").update(basePayload).eq("id", editingId);
        if (error) throw error;

        allExpenses = allExpenses.map((expense) =>
          expense.id === editingId ? { ...expense, ...basePayload } : expense
        );
        rememberLastChoice(forma, orcamento);
        populateHistoryFilters();
        applyHistoryFilters();
        populateDashboardFilters();
        renderDashboard();

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

    const payload = { ...basePayload, client_id: randomUuid() };

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
    elements.forma.addEventListener("change", toggleInstallmentsField);
    elements.valor.addEventListener("blur", formatMoneyInput);
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.expenseForm.addEventListener("submit", handleSave);
    elements.refreshButton.addEventListener("click", loadRecent);
    elements.personFilter.addEventListener("change", applyHistoryFilters);
    elements.monthFilter.addEventListener("change", applyHistoryFilters);
    elements.yearFilter.addEventListener("change", applyHistoryFilters);
    elements.openHistoryButton.addEventListener("click", () => showAppScreen("history"));
    elements.openDashboardButton.addEventListener("click", () => showAppScreen("dashboard"));
    elements.dashboardMonthFilter.addEventListener("change", renderDashboard);
    elements.dashboardYearFilter.addEventListener("change", renderDashboard);
    elements.editIncomeButton.addEventListener("click", () => showIncomeEdit(true));
    elements.cancelIncomeButton.addEventListener("click", () => showIncomeEdit(false));
    elements.saveIncomeButton.addEventListener("click", () => void saveMonthlyIncome());
    elements.dashboardIncomeInput.addEventListener("blur", formatMoneyInput);
    elements.backEntryButton.addEventListener("click", () => showAppScreen("entry"));
    elements.backDashboardButton.addEventListener("click", () => showAppScreen("entry"));
    elements.recentList.addEventListener("click", handleHistoryListClick);
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
