INSERT INTO buildings (id, code, name, alias, "functionDesc", "floorsCount", "roomsCount", capacity, "picName", "picPhone", status, "establishedYear", description, "createdAt", "updatedAt")
VALUES
('b-1', 'TWR-A', 'Gedung BJ Habibie', 'Tower A - Fakultas Ilmu Komputer', 'Dekanat FASILKOM, Lab Kecerdasan Buatan, Lab Jaringan, dan Ruang Kuliah Teori.', 6, 24, 2400, 'Heri Susanto, S.T. (Urusan Rumah Tangga A)', '0812-3456-7890', 'Aktif Beroperasi', 2018, 'Tower modern 6 lantai dengan fasilitas fiber optic 10 Gbps, smart classroom, dan data center kampus.', NOW(), NOW()),
('b-2', 'TWR-C', 'Gedung Soekarno', 'Tower C - Fakultas Teknik & Industri', 'Dekanat FTI, Workshop Mekatronika, Laboratorium Listrik Tenaga, dan Bengkel Mesin CNC.', 5, 28, 2200, 'Bambang Irawan (Urusan Rumah Tangga C)', '0813-9876-5432', 'Aktif Beroperasi', 2016, 'Fasilitas rekayasa terpadu dengan daya listrik industri 3-phase dan sistem ventilasi sirkulasi udara khusus.', NOW(), NOW()),
('b-3', 'TWR-B', 'Gedung Mohammad Hatta', 'Tower B - Fakultas Ekonomi & Bisnis', 'Dekanat FEBD, Laboratorium FinTech, Galeri Investasi BEI, dan Ruang Kuliah Eksekutif.', 4, 18, 1800, 'Rahmat Hidayat, A.Md. (URT B)', '0857-1122-3344', 'Aktif Beroperasi', 2019, 'Pusat pembelajaran bisnis digital dilengkapi simulasi trading bursa efek dan auditorium mini.', NOW(), NOW()),
('b-4', 'TWR-D', 'Gedung Ki Hajar Dewantara', 'Tower D - Fakultas Desain Komunikasi Visual', 'Dekanat FDKV, Studio Rendering 3D, Studio Motion Capture Animasi, dan Galeri Seni.', 4, 16, 1400, 'Yusuf Maulana (URT D)', '0821-4455-6677', 'Aktif Beroperasi', 2021, 'Gedung kreatif dengan akustik khusus, studio fotografi profesional, dan lab komputasi grafis Mac/Workstation.', NOW(), NOW()),
('b-5', 'GRH-NUT', 'Graha Nusantara (Rektorat & BAAK)', 'Gedung Pusat Administrasi Kampus', 'Kantor Rektor & Wakil Rektor, Layanan Terpadu BAAK, Biro Keuangan, dan Balai Sidang Senat.', 4, 14, 800, 'Ir. Joko Pramono (Kepala Sarana Prasarana)', '0811-7788-9900', 'Aktif Beroperasi', 2015, 'Pusat pelayanan administratif sivitas akademika terpadu satu atap (One Stop Academic Service).', NOW(), NOW()),
('b-6', 'HUB-INOV', 'Pusat Riset & Hub Inovasi Digital', 'Gedung Inkubator & Kolaborasi Industri', 'Coworking space riset multidisiplin, inkubator startup mahasiswa, dan laboratorium bersama mitra teknologi.', 3, 12, 600, 'Didik Kurniawan, S.Kom. (Pengelola Hub)', '0878-2233-4455', 'Aktif Beroperasi', 2023, 'Gedung riset terapan kolaboratif penghubung kampus dengan industri digital dan venture capital.', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  alias = EXCLUDED.alias,
  "functionDesc" = EXCLUDED."functionDesc",
  "floorsCount" = EXCLUDED."floorsCount",
  "roomsCount" = EXCLUDED."roomsCount",
  capacity = EXCLUDED.capacity,
  "picName" = EXCLUDED."picName",
  "picPhone" = EXCLUDED."picPhone",
  status = EXCLUDED.status,
  "establishedYear" = EXCLUDED."establishedYear",
  description = EXCLUDED.description,
  "updatedAt" = NOW();
