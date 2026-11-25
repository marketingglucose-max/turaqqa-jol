// Other games share this origin, so only touch caches with this prefix.
const PREFIX='turaq-',CACHE=PREFIX+'v1';
const FILES=['./','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-180.png','icons/icon-32.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

// The page: newest version when the network answers quickly, saved copy otherwise.
async function page(event){
 const cache=await caches.open(CACHE);
 const fresh=fetch(event.request.url,{cache:'no-cache'}).then(async r=>{if(r.ok)await cache.put('./',r.clone());return r});
 event.waitUntil(fresh.catch(()=>{}));
 const saved=await cache.match('./');
 if(!saved)return fresh;
 const wait=new Promise(done=>setTimeout(()=>done(saved),2500));
 return Promise.race([fresh.then(r=>r.ok?r:saved,()=>saved),wait])
}
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
 if(e.request.mode==='navigate')e.respondWith(page(e));
 else e.respondWith(caches.open(CACHE).then(c=>c.match(e.request)).then(hit=>hit||fetch(e.request)))
});
