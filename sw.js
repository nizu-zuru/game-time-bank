const CACHE="game-time-bank-v38";
const ASSETS=[
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./image/Cleared_2.webp",
  "./image/Cleared_4.webp",
  "./image/Cleared_6.webp",
  "./image/Cleared_all.webp",
  "./image/-.webp",
  "./image/+.webp",
  "./sound/se/clear.opus",
  "./sound/se/perfect.opus",
  "./sound/se/pi_memu.opus",
  "./sound/se/pikon_15hun.opus",
  "./sound/voice/finish.opus",
  "./sound/voice/nokori1hun.opus",
  "./sound/voice/nokori5hun.opus",
  "./sound/voice/nokori10hun.opus",
  "./sound/voice/nokori30hun.opus",
  "./sound/voice/start.opus",
  "./sound/voice/30min_passed.opus",
  "./sound/voice/60min_passed.opus",
  "./sound/voice/stop.opus",
  "./sound/voice/finish.opus"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("message",e=>{
  if(e.data && e.data.type==="SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch",e=>{
  const url=new URL(e.request.url);
  const isCore=url.pathname.endsWith("/index.html") || url.pathname.endsWith("/app.js") || url.pathname.endsWith("/style.css") || url.pathname.endsWith("/sw.js");
  if(isCore){
    e.respondWith(fetch(e.request,{cache:"no-store"}).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      return response;
    }).catch(()=>caches.match(e.request)));
  }else{
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
  }
});
