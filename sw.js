
//version for reload control
const ELOG_SW_VERSION="2.0.1"

//careful this name is also in doLogout in main.js
var cacheName = 'elogapp-v2';
var filesToCache = [
    "/index.html",
    "/main.css",
    "/login.html",
    "/",

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
    "/favicon.ico",

    //scripts
    "/sw.js",
    "/manifest.json",
    "/scripts/jquery.min.js",
    "/scripts/logentry.js",
    "/scripts/main.js",
    "/scripts/menu.js",
    "/scripts/pcr.js",
    "/scripts/settings.js",
    "/scripts/ww.js",

    //api
    //"/elog/v2/choicelists/"


];

self.addEventListener('install', function(e) {
    console.log('Service Worker Installing');
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
    console.log('ServiceWorker Install');

});

self.addEventListener('fetch', function(event) {
    console.log("Cache Request: " + event.request.url );
    var page=caches.match(event.request).then(function(response) {
            // Cache hit - return response
            if (response) {
                return response;
            }
            console.log("Cache Miss " + event.request.url)
            return fetch(event.request);
        }
    )

    event.respondWith(page);
});


self.addEventListener('activate', function (event) {
    console.log('** '+ ELOG_SW_VERSION + ' is Activated');
});
