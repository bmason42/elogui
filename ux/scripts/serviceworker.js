//careful this name is also in doLogout in main.js
var cacheName = 'elogapp-v2';
var filesToCache = [
    "/",
    "/index.html",
    "/main.css",

    //images
    "/images/esd-logo.png",
    "/images/gifted-icon.png",
    "/images/list-icon.png",
    "/images/localonly.png",
    "/images/lock-icon.png",
    "/images/logentry-icon.png",
    "/images/logo-512.png",
    "/images/logo.png",
    "/images/logout.png",
    "/images/notsynced.png",
    "/images/pcr-icon.png",
    "/images/report-icon.png",
    "/images/settings.png",
    "/images/sync.png",

    //scripts
    "/scripts/jquery.js",
    "/scripts/logentry.js",
    "/scripts/main.js",
    "/scripts/manifest.json",
    "/scripts/menu.js",
    "/scripts/serviceworker.js",
    "/scripts/settings.js",
    "/scripts/ww.js"

];

self.addEventListener('install', function(e) {
    console.log('[SeviceWorker] Installing');
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            var promise
            try {
                 promise = cache.addAll(filesToCache);
            }catch (e) {
                console.log("Error in stuff " + e)
            }
            return promise;
        })
    );
    console.log('[ServiceWorker] Install');
});
self.addEventListener('fetch', function(event) {
    console.log("Cache Request: " + event.request );
    var page=caches.match(event.request).then(function(response) {
            // Cache hit - return response
            if (response) {
                return response;
            }
            return fetch(event.request);
        }
    )

    event.respondWith(page);
});