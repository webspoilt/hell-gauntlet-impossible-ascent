// Simple Service Worker for PWA functionality
const CACHE_NAME = 'hells-gauntlet-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/sound-save-ads.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});