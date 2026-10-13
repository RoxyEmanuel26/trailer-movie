# Temuan teknis

Perbaikan menyentuh canonical pagination, validasi host, indexability orphan person, pengecualian CMS pada sitemap, TTL snapshot, shard yang hilang, kegagalan storage, batas XML, serta penanganan NotFoundError versus gangguan database.

Kode utama: SeoService/SeoRepository/PersonRepository, sitemap-cache/sitemap-data/sitemap-xml, route sitemap, CatalogPage, dan site-config. Tes regresi berada di seo-foundation dan production-hardening. Preflight belum otomatis membuktikan konsistensi seluruh URL terhadap database ketika katalog sedang berubah; crawl menyeluruh dilakukan sesudah release stabil.
