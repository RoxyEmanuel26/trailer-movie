# Structured data dan performa

Rating dan review impor tidak diklaim sebagai rich result MovieFlix; person memakai WebPage/Person, tanggal trailer tidak direkayasa, dan gambar sosial tidak memiliki dimensi palsu. CollectionPage/ItemList pagination menggunakan canonical halaman yang sedang dilihat.

Statistik landing memakai satu SQL terparameterisasi, dicache lima menit, dan ikut tag invalidasi katalog. Ini mengurangi query/koneksi berulang, bukan penyelesaian otomatis untuk kapasitas disk/network/database. Query nyata horror selesai dalam 28,3 detik dan tahun 2025 dalam 6,5 detik saat beban berjalan; keduanya masih perlu dipercepat. Request genre development sempat timeout dan cold pagination production lokal juga lambat. Tidak ada klaim lulus kapasitas 100.000 pengguna serentak.
