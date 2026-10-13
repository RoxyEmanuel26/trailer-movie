# Urutan peluncuran dan pertumbuhan

## Sebelum membuka indexing

- Selesaikan pemeriksaan build dan preflight pada release yang benar-benar akan dipasang.
- Tuntaskan cold-query latency katalog dan HTTP 200 not-found streaming yang ditemukan pada smoke test; preflight saat ini belum lulus menyeluruh.
- Pasang Node/Pterodactyl dan Tunnel dengan origin tidak bisa dilewati melalui IP:port publik.
- Pastikan PostgreSQL stabil saat import; gunakan private route/TLS atau firewall allowlist sesuai rencana keamanan. Rotasi kredensial yang pernah terekspos.
- Aktifkan DNS apex dan www, HTTPS, redirect apex permanen satu lompatan ke www, dan Cloudflare Access admin.
- Isi environment production dan email kontak nyata. Jangan kirim secret melalui chat/Git.
- Deploy pertama dengan SEO_INDEXING_ENABLED=false. Pastikan host preview tetap noindex.
- Jalankan `pnpm exec tsx scripts/seo-preflight.ts https://www.movieflix.site` ketika indexing masih nonaktif. Script baca-saja; tidak melakukan import atau submit Search Console.
- Periksa header, canonical, metadata, robots, semua shard sitemap, RSS, gambar, login, dan konsol browser production.
- Perbaiki latency/timeout yang tersisa; lakukan load test bertahap terhadap lingkungan yang diizinkan, bukan 100.000 request mendadak.
- Setelah lulus: aktifkan indexing dan rebuild/redeploy. Variabel SEO dibaca saat build juga; mengganti runtime saja bukan jaminan cukup. Image Docker lama mengunci flag build nonaktif, sementara target utama adalah launcher Node egg.
- Jalankan preflight ulang dengan `SEO_PREFLIGHT_INDEXING=true`, periksa Search Console Domain Property, submit hanya sitemap index, inspect sampel halaman.

## Dua minggu pertama

- Pantau availability, 5xx/503, latency, koneksi/IO/disk database, crawl dan sitemap errors setiap hari.
- Pastikan import menginvalidasi cache dan URL noindex tidak masuk sitemap.
- Validasi Googlebot sebenarnya melalui Search Console/log yang benar, bukan sekadar User-Agent yang dapat dipalsukan.

## Minggu 4/8/12

- Prioritaskan halaman dengan impressions relevan tetapi CTR rendah untuk judul/deskripsi yang akurat.
- Pilih topik kurasi dari query dan kebutuhan pengguna nyata; publikasi harus menambah nilai, bukan penggandaan katalog.
- Bandingkan Amerika/Inggris/Kanada dan negara Eropa berbahasa Inggris sebagai segmen laporan, tanpa menganggap semua Eropa satu bahasa.
- Tambahkan terjemahan hanya jika ada kemampuan memelihara konten dan availability wilayahnya.
- Tidak ada janji ranking pertama, rich result, maupun angka pertumbuhan tertentu.
