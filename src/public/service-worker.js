// public/service-worker.js

// PENTING: Ubah CACHE_NAME setiap kali Anda mengubah daftar urlsToCache atau logika di service-worker.js ini.
// Ini memastikan browser menginstal Service Worker versi baru dan memperbarui cache.
// Ubah ini ke versi yang lebih tinggi (misalnya v7, v8, v9, dst.) setiap kali ada perubahan pada service worker ini.
const CACHE_NAME = 'story-explorer-cache-v8'; // <--- PASTIKAN INI ADALAH VERSI YANG PALING BARU.

// Daftar aset statis yang membentuk "Application Shell" Anda.
const urlsToCache = [
  '/',                     // Root URL, biasanya melayani index.html
  '/index.html',           // File HTML utama Anda
  '/favicon.png',          // Favicon Anda
  '/manifest.json',        // Manifest PWA Anda
  '/styles/styles.css',    // File CSS utama Anda (pastikan path ini benar relatif terhadap root PWA)
  '/scripts/index.js',     // File JavaScript utama Anda (pastikan path ini benar relatif terhadap root PWA)
  // Tambahkan aset statis lain yang di-cache di sini, misalnya gambar-gambar yang digunakan di App Shell
  // Pastikan path-nya benar relatif terhadap root publik aplikasi Anda.
  // Contoh: jika marker-icon.png ada di /public/images/
  // '/images/marker-icon.png',
  // '/images/hero-bg.jpg', // Jika ada
];

// Kunci publik VAPID untuk notifikasi push (tetap sama)
const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';


self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and Caching App Shell (Cache Version:', CACHE_NAME, ')');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching assets:', urlsToCache);
        return cache.addAll(urlsToCache)
          .then(() => console.log('Service Worker: App Shell assets added to cache.'))
          .catch((error) => console.error('Service Worker: Failed to add some assets to cache:', error));
      })
      .then(() => self.skipWaiting()) // Mengaktifkan Service Worker baru segera
      .catch((error) => console.error('Service Worker: Installation failed:', error))
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating (Cache Version:', CACHE_NAME, ')');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Hapus cache lama kecuali yang sedang aktif.
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim()) // Mengambil kontrol atas halaman yang ada
    .catch((error) => console.error('Service Worker: Activation failed:', error))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // === STRATEGI UNTUK PERMINTAAN API & EKSTENSI BROWSER ===
  // Biarkan permintaan API melewati Service Worker untuk ditangani langsung oleh browser
  // (dan kemudian ditangani oleh StoryModel dengan fallback IndexedDB).
  // Biarkan juga permintaan dari ekstensi Chrome melewati Service Worker.
  const isApiRequest = url.origin === 'https://story-api.dicoding.dev';
  const isChromeExtension = url.protocol === 'chrome-extension:'; 
  const isFontAwesome = url.origin === 'https://ka-f.fontawesome.com'; // Contoh: jika Anda menggunakan Font Awesome CDN

  if (isApiRequest || isChromeExtension || isFontAwesome) {
      // Console log untuk debugging, bisa dihapus setelah yakin berfungsi
      // console.log('Service Worker: Allowing API/Extension/FontAwesome request to pass through:', event.request.url);
      return; // Cukup biarkan permintaan ini tidak ditangani oleh Service Worker
  }

  // === STRATEGI Cache-First untuk aset Application Shell (HTML, CSS, JS, Gambar Statis) ===
  // Ini memastikan UI statis dimuat dengan cepat, bahkan saat offline.
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Jika aset ada di cache (dari CACHE_NAME), kembalikan.
      if (response) {
        // console.log('Service Worker: Serving from cache:', event.request.url);
        return response;
      }
      
      // Jika tidak ada di cache, coba fetch dari jaringan.
      // console.log('Service Worker: Fetching from network:', event.request.url);
      return fetch(event.request).catch(() => {
        // Fallback jika fetch gagal (misalnya offline)
        if (event.request.mode === 'navigate') {
          console.log('Service Worker: Navigating offline, returning /index.html from cache.');
          return caches.match('/index.html');
        }
        // Untuk aset lain yang tidak di-cache dan tidak dapat di-fetch,
        // Anda bisa mengembalikan respons offline generik atau tidak mengembalikan apa-apa.
        console.warn('Service Worker: Could not fetch asset from network and not in cache:', event.request.url);
        // Mengembalikan respons offline yang lebih informatif untuk aset non-HTML
        return new Response('<h1>You are offline</h1><p>The requested resource could not be loaded.</p>', {
          headers: { 'Content-Type': 'text/html' },
          status: 503, // Service Unavailable
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// Event Listener untuk Notifikasi Push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received!', event.data);
  let notificationData;
  try {
    notificationData = event.data.json();
    console.log('Service Worker: Push Data (JSON):', notificationData);
  } catch (e) {
    // Jika data bukan JSON atau kosong, gunakan default
    console.warn('Service Worker: Push data is not JSON or empty. Using default notification.', e);
    notificationData = {
      title: 'Ada Pembaruan!',
      options: {
        body: 'Ada cerita baru atau pembaruan penting di aplikasi Anda.',
        icon: '/favicon.png', // Pastikan path ini benar
        badge: '/favicon.png' // Opsional: ikon kecil di area notifikasi pada Android
      }
    };
  }

  const { title, options } = notificationData;

  // Pastikan icon ada di options atau tambahkan default jika tidak ada
  const finalOptions = {
    ...options,
    icon: options.icon || '/favicon.png', // Fallback icon
    badge: options.badge || '/favicon.png', // Fallback badge
  };

  try {
    event.waitUntil(
      self.registration.showNotification(title, finalOptions)
        .then(() => console.log("Service Worker: showNotification called successfully."))
        .catch((error) => console.error("Service Worker: showNotification failed:", error))
    );
  } catch (error) {
    console.error("Service Worker: Error in push event listener (showNotification call):", error);
  }
});

// Event Listener untuk klik notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification Clicked', event.notification.tag);
  event.notification.close(); // Tutup notifikasi setelah diklik

  const clickedNotification = event.notification;
  const action = event.action; // Jika Anda memiliki action buttons pada notifikasi

  // Jika Anda memiliki URL dalam data notifikasi, buka URL tersebut
  const targetUrl = clickedNotification.data && clickedNotification.data.url ? clickedNotification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        // Jika aplikasi sudah terbuka, fokus ke tab tersebut
        if (client.url === targetUrl && 'focus' in client) {
          console.log('Service Worker: Focusing existing window to:', targetUrl);
          return client.focus();
        }
      }
      // Jika aplikasi belum terbuka atau tidak ada tab yang cocok, buka tab baru
      console.log('Service Worker: Opening new window to:', targetUrl);
      return clients.openWindow(targetUrl);
    })
  );
});

// Event listener untuk pesan dari client (misal untuk mengambil kunci publik VAPID)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_VAPID_PUBLIC_KEY') {
        event.waitUntil(
            event.source.postMessage({
                type: 'VAPID_PUBLIC_KEY_RESPONSE',
                publicKey: VAPID_PUBLIC_KEY
            })
        );
        console.log('Service Worker: Responded with VAPID Public Key to client.');
    }
});