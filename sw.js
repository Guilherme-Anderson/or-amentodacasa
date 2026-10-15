/*
  Gastos da Casa — service worker (desde a versão 2.11).

  Objetivo: abrir o app na hora, inclusive no iPhone, onde o PWA da tela de
  início é encerrado com frequência e cada abertura baixava tudo de novo.

  - index.html: responde do cache e atualiza em segundo plano
    (uma versão nova aparece na abertura seguinte).
  - CSS/JS/ícones com ?v=x.y.z e a biblioteca do Supabase (versão fixa):
    cache primeiro — a URL muda quando o arquivo muda.
  - API, login e fotos do Supabase: nunca passam pelo cache.

  A versão vem da própria URL de registro (sw.js?v=x.y.z, definida pelo
  APP_VERSION do app.js), então este arquivo não precisa mudar a cada versão.
  Só atualize SUPABASE_LIB se mudar o <script> do Supabase no index.html.
*/
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE_PREFIX = "gastos-da-casa-shell-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const SUPABASE_LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js";
const SHELL_URL = new URL("./", self.registration.scope).href;

const PRECACHE = [
  "./",
  `styles.css?v=${VERSION}`,
  `config.js?v=${VERSION}`,
  `app.js?v=${VERSION}`,
  `icons/icon-192.png?v=${VERSION}`,
  "manifest.json",
  SUPABASE_LIB
];

// O Safari recusa respostas "redirecionadas" vindas do service worker em
// navegações; guardamos sempre uma cópia limpa.
async function cleanResponse(response) {
  if (!response.redirected) return response;
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRECACHE.map(async (path) => {
      const url = new URL(path, self.registration.scope).href;
      const response = await fetch(url, { cache: "reload" });
      if (!response.ok) throw new Error(`Falha ao guardar ${url}: ${response.status}`);
      await cache.put(url, await cleanResponse(response));
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith("gastos-da-casa-") && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

async function shellFromCache(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(SHELL_URL);

  const network = fetch(event.request).then(async (response) => {
    if (response.ok && response.type === "basic") {
      await cache.put(SHELL_URL, await cleanResponse(response.clone()));
    }
    return response;
  });

  if (cached) {
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && (response.type === "basic" || response.type === "cors")) {
    await cache.put(request, await cleanResponse(response.clone()));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  const scopePath = new URL(self.registration.scope).pathname;
  const isShell = url.pathname === scopePath || url.pathname === `${scopePath}index.html`;

  if (request.mode === "navigate" && sameOrigin && isShell) {
    event.respondWith(shellFromCache(event));
    return;
  }

  if (url.href === SUPABASE_LIB) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (sameOrigin && url.pathname.endsWith("/sw.js")) return;

  if (sameOrigin && (url.searchParams.has("v") || url.pathname.endsWith("/manifest.json"))) {
    event.respondWith(cacheFirst(request));
  }
  // Todo o resto (Supabase, fotos assinadas etc.) vai direto para a rede.
});
