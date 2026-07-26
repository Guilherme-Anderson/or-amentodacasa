(() => {
  "use strict";

  const APP_VERSION = "2.3.0";
  const OFFLINE_QUEUE_KEY = "gastos-da-casa-offline-v2";
  const THEME_STORAGE_KEY = "gastos-da-casa-theme";
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

  const elements = {
    loginView: document.querySelector("#login-view"),
    appView: document.querySelector("#app-view"),
    entryScreen: document.querySelector("#entry-screen"),
    historyScreen: document.querySelector("#history-screen"),
    loginForm: document.querySelector("#login-form"),
    expenseForm: document.querySelector("#expense-form"),
    loginMessage: document.querySelector("#login-message"),
    expenseMessage: document.querySelector("#expense-message"),
    diagnosticMessage: document.querySelector("#diagnostic-message"),
    loginButton: document.querySelector("#login-button"),
    saveButton: document.querySelector("#save-button"),
    logoutButtons: [...document.querySelectorAll(".logout-button")],
    openHistoryButton: document.querySelector("#open-history-button"),
    backEntryButton: document.querySelector("#back-entry-button"),
    refreshButton: document.querySelector("#refresh-button"),
    showPassword: document.querySelector("#show-password"),
    email: document.querySelector("#email"),
    password: document.querySelector("#password"),
    gasto: document.querySelector("#gasto"),
    valor: document.querySelector("#valor"),
    forma: document.querySelector("#forma"),
    orcamento: document.querySelector("#orcamento"),
    agora: document.querySelector("#agora"),
    dateField: document.querySelector("#date-field"),
    dateInput: document.querySelector("#data-hora"),
    observacao: document.querySelector("#observacao"),
    recentList: document.querySelector("#recent-list"),
    signedUser: document.querySelector("#signed-user"),
    toast: document.querySelector("#toast"),
    themeToggles: [...document.querySelectorAll("[data-theme-toggle]")],
    themeColor: document.querySelector('meta[name="theme-color"]')
  };

  let supabaseClient = null;
  let currentSession = null;
  let toastTimer = null;
  let authRenderToken = 0;
  let activeScreen = "entry";
  let historyNeedsRefresh = true;

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

  function formatMoneyInput() {
    const value = parseMoney(elements.valor.value);
    if (Number.isFinite(value)) {
      elements.valor.value = value.toLocaleString("pt-BR", {
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

  function setAuthenticatedView(isAuthenticated) {
    elements.loginView.classList.toggle("hidden", isAuthenticated);
    elements.appView.classList.toggle("hidden", !isAuthenticated);
  }

  function showAppScreen(screenName) {
    const showHistory = screenName === "history";
    activeScreen = showHistory ? "history" : "entry";

    elements.entryScreen.classList.toggle("hidden", showHistory);
    elements.historyScreen.classList.toggle("hidden", !showHistory);

    if (showHistory) {
      if (historyNeedsRefresh) {
        void loadRecent();
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

  function renderRecent(items) {
    if (!items?.length) {
      elements.recentList.innerHTML =
        '<p class="empty-state">Nenhum lançamento encontrado.</p>';
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

        return `
          <article class="expense-item">
            <h3>${escapeHtml(item.gasto)}</h3>
            <span class="expense-value">${moneyFormatter.format(Number(item.valor))}</span>
            <p class="expense-meta">${escapeHtml(item.forma)} · ${escapeHtml(item.orcamento || "Sem categoria")} · ${escapeHtml(formattedDate)}</p>
            ${note}
          </article>`;
      })
      .join("");
  }

  async function loadRecent() {
    if (!supabaseClient || !currentSession) return;

    elements.refreshButton.disabled = true;
    elements.recentList.setAttribute("aria-busy", "true");

    try {
      const { data, error } = await supabaseClient
        .from("gastos")
        .select("id,gasto,valor,forma,orcamento,ocorrido_em,observacao")
        .order("ocorrido_em", { ascending: false })
        .limit(50);

      if (error) throw error;
      renderRecent(data);
      historyNeedsRefresh = false;
    } catch (error) {
      elements.recentList.innerHTML = `<p class="empty-state">Não foi possível carregar: ${escapeHtml(
        error?.message || "erro desconhecido"
      )}</p>`;
    } finally {
      elements.refreshButton.disabled = false;
      elements.recentList.removeAttribute("aria-busy");
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

      const { error } = await supabaseClient.from("gastos").insert(item.payload);

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
    elements.forma.value = "PIX";
    elements.orcamento.value = "";
    toggleDateField();
    elements.gasto.focus();
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
      historyNeedsRefresh = true;
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

    const payload = {
      gasto,
      valor,
      forma,
      orcamento,
      ocorrido_em: occurredAt.toISOString(),
      observacao: observacao || null,
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
    elements.valor.addEventListener("blur", formatMoneyInput);
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.expenseForm.addEventListener("submit", handleSave);
    elements.refreshButton.addEventListener("click", loadRecent);
    elements.openHistoryButton.addEventListener("click", () => showAppScreen("history"));
    elements.backEntryButton.addEventListener("click", () => showAppScreen("entry"));
    elements.showPassword.addEventListener("change", () => {
      elements.password.type = elements.showPassword.checked ? "text" : "password";
    });
    window.addEventListener("online", () => {
      void flushOfflineQueue();
    });

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
