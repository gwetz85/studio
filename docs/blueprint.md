# **App Name**: NetInvoice Offline

## Core Features:

- Manajemen Data Pelanggan: Menambahkan, melihat, mengedit, dan menghapus detail pelanggan seperti nama, alamat, paket internet, dan informasi kontak.
- Definisi Paket Layanan: Mengkonfigurasi berbagai paket layanan internet beserta harga dan ketentuannya.
- Pelacakan & Status Pembayaran: Mencatat pembayaran iuran bulanan untuk setiap pelanggan dan melacak status pembayaran (misalnya, jatuh tempo, lunas, atau lewat jatuh tempo).
- Penyimpanan Data Offline: Memanfaatkan IndexedDB untuk menyimpan semua data aplikasi secara lokal di browser, memastikan fungsionalitas penuh meskipun tanpa koneksi internet.
- Antarmuka Pengguna Offline-First: Antarmuka dirancang untuk berfungsi dengan lancar dan memberikan umpan balik kepada pengguna meskipun tidak ada koneksi jaringan.
- Alat Pengingat Pembayaran Otomatis: Meningkatkan pembayaran tepat waktu dengan tool AI yang membuat draf pesan pengingat yang dipersonalisasi untuk pembayaran yang lewat jatuh tempo, berdasarkan detail pelanggan seperti nama dan jumlah terutang.

## Style Guidelines:

- Skema warna terang yang bersih untuk kemudahan membaca. Warna utama: Biru stabil (#2683D9), mencerminkan kepercayaan dan teknologi, berfungsi sebagai dasar visual. Warna latar belakang: Biru terang yang hampir netral (#EBF1F6), memastikan fokus pada konten. Warna aksen: Cyan yang cerah (#3DE3E3), memberikan kontras yang menyegarkan untuk elemen interaktif penting dan CTA.
- Menggunakan font sans-serif 'Inter' untuk keseluruhan aplikasi. Font ini dipilih karena gaya grotesk, modern, objektif, dan netralnya yang ideal untuk tampilan data yang bersih dan mudah dibaca dalam manajemen data pelanggan dan penagihan.
- Gunakan ikon sederhana dan jelas dalam gaya minimalis yang mendukung tindakan seperti 'tambah pelanggan', 'edit pembayaran', atau 'lihat laporan', menjaga antarmuka tetap rapi dan mudah dinavigasi.
- Tata letak yang terstruktur dan terorganisir dengan navigasi sidebar intuitif, area konten utama yang luas untuk tabel data dan formulir, dan bilah alat di bagian atas untuk tindakan umum, memastikan efisiensi pengelolaan data.
- Animasi halus untuk umpan balik instan saat data disimpan, diupdate, atau saat berpindah antar tampilan, menciptakan pengalaman pengguna yang responsif tanpa mengganggu alur kerja.