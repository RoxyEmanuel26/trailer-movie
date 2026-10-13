# MovieFlix — audit SEO pra-peluncuran

Tanggal: 12 Oktober 2026. Target: katalog film berbahasa Inggris untuk Amerika dan Eropa.

## Kesimpulan

Perbaikan teknis telah diterapkan, tetapi situs belum dapat dinyatakan siap ranking atau siap traffic besar berdasarkan pemeriksaan lokal saja. Tidak ada konfigurasi SEO yang menjamin peringkat pertama dunia. Katalog yang bersumber dari data umum membutuhkan nilai tambahan yang nyata, bukan sekadar lebih banyak URL atau kata kunci.

Audit memakai panduan SEO/SEO Audit, Graphify untuk hubungan kode, dan dokumentasi Next.js yang terpasang. Pemeriksaan mencakup kode metadata, schema, sitemap, RSS, indexability, provider, query katalog, tes regresi, serta sampel HTTP/browser lokal. Ini bukan crawl produksi 500 halaman, pengukuran CrUX, atau audit backlink berbayar. Tidak ada volume keyword atau skor ranking yang direkayasa.

## Temuan dan implementasi

| Prioritas | Temuan | Perubahan |
|---|---|---|
| P1 | Snapshot sitemap dapat dianggap segar tanpa batas | TTL lokal lima menit, fallback lama hanya setelah kegagalan, pembacaan tidak memperpanjang TTL |
| P1 | Gagal menulis snapshot dapat menggagalkan XML valid | XML hasil generasi tetap disajikan; penyimpanan best-effort dan nama file sementara unik |
| P1 | Snapshot bisa menghidupkan kembali shard yang sudah hilang | Batas shard diperiksa; 404 tidak memakai fallback snapshot |
| P1 | Sitemap mengabaikan sebagian pengecualian CMS | Movie/person dan core menghormati noindex/inSitemap; genre/koleksi tanpa intro tidak dipromosikan |
| P1 | Canonical override CMS dapat menyatukan halaman pagination | Page N self-canonical, judul Page N; schema katalog memakai URL halaman yang sama |
| P1 | Rating/review impor berpotensi diklaim sebagai rich result milik situs | AggregateRating/Review impor dikeluarkan dari schema film; tampilan rating/review tetap ada |
| P1 | ProfilePage dipakai untuk aktor yang bukan anggota/penulis situs | WebPage dengan Person sebagai mainEntity dan publisher canonical |
| P1 | Trailer dapat memakai tanggal rilis film sebagai tanggal upload | Hanya tanggal publikasi video yang diketahui; identifier YouTube divalidasi |
| P1 | Error database dapat berubah menjadi 404 konten | Hanya NotFoundError yang menjadi 404 pada akses film/genre/tag/koleksi terkait |
| P2 | Profil tanpa film published berpotensi indexable | Profil harus memiliki kredit published, selain aturan foto/biografi/filmografi |
| P2 | Gambar sosial mengklaim dimensi yang tidak diketahui | Gambar katalog dibatasi ukurannya tanpa dimensi crop palsu; gambar brand memiliki dimensi nyata |
| P2 | Sitemap dengan ekstensi video dapat terlalu besar | Shard movie 10.000 URL, deduplikasi dan guard 50.000 URL/50 MB; namespace snapshot diperbarui |
| P2 | Opsi tontonan negara berbeda dicampurkan | Pilihan negara eksplisit dan filter provider sebelum penggabungan; tanpa redirect IP |
| P2 | Statistik landing dihitung ulang dan mengambil beberapa koneksi | Satu SQL terparameterisasi dengan predicate public literal, cache lima menit dan tag invalidasi katalog |
| P2 | Copy menyatakan timestamp terlihat padahal sudah dihapus | About/Methodology disesuaikan dengan perilaku nyata dan batas kesegaran data |
| P2 | Variasi tahun/shard berawalan nol menjadi URL duplikat | Sintaks tahun empat digit dan nomor shard canonical diperketat |

Canonical tetap `https://www.movieflix.site`. Kredensial, port tambahan, path, query, dan hash tidak diterima sebagai konfigurasi root production. Header global tidak lagi memaksakan `index,follow` pada seluruh route. Indexing pra-peluncuran tetap nonaktif. Tidak ada perubahan `.env`, schema, atau data katalog dalam pekerjaan SEO ini; migrasi indeks yang sudah ada berasal dari pekerjaan database sebelumnya.

## Batas rich results yang penting

Google melarang penggabungan rating situs lain untuk review rich results. Menampilkan rating informatif tidak sama dengan boleh mengklaimnya sebagai rating MovieFlix. [Panduan review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).

ProfilePage ditujukan untuk profil yang berafiliasi dengan situs, misalnya penulis atau anggota komunitas. Halaman katalog aktor lebih tepat memakai WebPage/Person. [Panduan ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page).

VideoObject tanpa tanggal upload yang diketahui tidak dijanjikan memenuhi seluruh syarat rich result. Halaman detail film dengan trailer juga tidak otomatis dianggap halaman yang tujuan utamanya menonton video. Jangan menciptakan tanggal atau klaim eligibility. [Video structured data](https://developers.google.com/search/docs/appearance/structured-data/video), [video SEO](https://developers.google.com/search/docs/appearance/video).

## Strategi pertumbuhan Amerika/Eropa

1. Mulai dari kebutuhan spesifik: judul + trailer, cast/character, director, tahun, dan where-to-watch menurut negara. Ukur query nyata setelah peluncuran; jangan mengasumsikan volume tinggi.
2. Pertahankan satu versi bahasa Inggris global sekarang. Jangan membuat en-US/en-GB/hreflang palsu untuk halaman yang identik atau mengarahkan pengguna berdasarkan IP. Terjemahan baru memerlukan konten nyata, URL, canonical, dan hreflang timbal balik. [Situs multi-regional](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).
3. Bangun sedikit panduan orisinal yang diverifikasi manusia: pilihan horror terbaru, thriller Eropa, film festival/independen, atau rekomendasi berdasarkan tema dengan alasan pemilihan yang benar. Cantumkan editor sebenarnya jika memang ada. Jangan menciptakan penulis, pengalaman menonton, review, atau ribuan teks AI saat request.
4. Tambahkan nilai kurasi, perbandingan, atau informasi wilayah yang dapat dibuktikan. Synopsis dan fakta yang tersedia di banyak katalog belum cukup menjadi keunggulan kompetitif. Tidak ada jumlah kata wajib dari Google. [Konten people-first](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
5. Dapatkan rujukan editorial relevan melalui karya berguna dan kemitraan nyata; bukan pembelian backlink massal atau spam direktori. Ini rekomendasi strategi, belum merupakan kampanye yang dijalankan.

## Validasi dan hal yang belum terbukti

Hasil pemeriksaan akhir dicatat di `audit-data.json`. Unit test tidak menggantikan crawl Google. Sampel homepage browser memiliki satu H1, canonical produksi, noindex pra-peluncuran, dan tidak memuat iframe YouTube sebelum interaksi. Pemeriksaan HTTP development pertama gagal timeout pada genre; `/movies?page=2` sempat membutuhkan sekitar 34,5 detik. Ini bukti bahwa performa belum boleh disertifikasi, bukan bukti p95 production.

Smoke test build production lokal juga menemukan cold pagination sekitar 34 detik, genre 101 detik, origin 76 detik, dan top-rated 28 detik pada versi sebelum optimasi statistik terakhir. Query statistik baru berhasil membaca data nyata (7.069 film horror) tetapi masih memerlukan 28,3 detik pada pengukuran tunggal dengan beban berjalan; ini belum memenuhi target publik. Tidak diklaim sebagai benchmark A/B atau percepatan sekian kali. Pemeriksaan juga menemukan URL genre tak dikenal mengirim HTTP 200 dengan mekanisme not-found streaming Next.js; preflight sengaja tetap gagal, bukan diubah agar terlihat lulus. Status 404 nyata pada semua URL konten tidak valid masih harus diselesaikan dan diuji ulang sebelum go-live; jangan menambah query existence tanpa cache ke setiap URL canonical secara tergesa-gesa.

Browser film diperiksa pada 390×844 dan 768×1024 tanpa overflow horizontal, dengan satu H1/canonical dan tanpa aggregateRating atau iframe YouTube awal. Person memiliki WebPage/Person/BreadcrumbList. Warning ukuran gambar studio terdeteksi saat pemeriksaan dan sizes eksplisit ditambahkan pada logo, avatar review, serta poster Known For. Pemeriksaan ini bukan sertifikasi seluruh kombinasi perangkat.

Build final kembali lulus, demikian pula TypeScript, lint repository, Prisma validation, 39 tes SEO (satu integrasi opsional dilewati), dan 27 tes import. Preflight sitemap terpisah memakai server standalone final, tetapi request sitemap index melewati timeout 120 detik sebelum respons; seluruh shard belum berhasil diverifikasi. Proses pemeriksaan milik audit dihentikan setelah selesai/gagal, bukan worker import atau server development pengguna. Indexing tidak diaktifkan.

Pada pemeriksaan DNS sesi ini, `www.movieflix.site` belum resolve. Search Console, public HTTPS, redirect apex, Rich Results Test live, Core Web Vitals p75, dan kapasitas Pterodactyl belum terverifikasi. Diagnostik database read-only memperlihatkan aktivitas menunggu pembacaan disk; penyebab timeout tidak bisa disimpulkan hanya dari satu snapshot. Koneksi database masih memperingatkan tidak terenkripsi. Jangan menyebut deployment aman atau mampu 100.000 pengguna serentak tanpa gerbang keamanan dan load test terkontrol.

Sitemap harus berisi URL canonical yang memang layak diindeks, dan submit sitemap tidak menjamin indexing. Guard ukuran mengikuti batas Google. [Panduan sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). Pagination tetap memiliki canonical masing-masing. [Panduan pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading).

## Pengukuran setelah go-live

Catat baseline, lalu evaluasi minggu 4/8/12: non-brand clicks, impressions, CTR, query/page, negara, perangkat, indexed eligible URLs, sitemap errors, rich-result eligibility, serta LCP/INP/CLS p75. Pisahkan kenaikan posisi dari perubahan jumlah halaman. Audit performa harus memakai build production, bukan kompilasi development; hasil bagus tidak menjamin ranking. [Page experience](https://developers.google.com/search/docs/appearance/page-experience).
