-- ====================================================================
-- SEED DATA MASTER AKADEMIK: PRODI & MATA KULIAH REFINEMENT
-- ====================================================================

-- Update existing 3 study programs with complete attributes
UPDATE study_programs SET
  code = 'TIF-S1',
  "diktiCode" = '55201',
  name = 'Teknik Informatika',
  "degreeLevel" = 'S1',
  "degreeTitle" = 'S.Kom.',
  accreditation = 'Unggul',
  "accreditationAgency" = 'LAM-INFOKOM',
  "skAkreditasi" = 'No. 088/SK/LAM-INFOKOM/Ak/S/2024',
  "headOfProgram" = 'Dr. Bambang Sutrisno, M.Kom.',
  "headNip" = '19790112 200501 1 002',
  status = 'Aktif',
  "studentsCount" = 1240,
  "lecturersCount" = 38
WHERE id = '15100fd9-aa2b-49ab-b959-32d38e947add';

UPDATE study_programs SET
  code = 'SI-S1',
  "diktiCode" = '57201',
  name = 'Sistem Informasi',
  "degreeLevel" = 'S1',
  "degreeTitle" = 'S.Kom.',
  accreditation = 'Unggul',
  "accreditationAgency" = 'LAM-INFOKOM',
  "skAkreditasi" = 'No. 112/SK/LAM-INFOKOM/Ak/S/2023',
  "headOfProgram" = 'Dewi Rahmawati, M.Kom.',
  "headNip" = '19820415 200812 2 001',
  status = 'Aktif',
  "studentsCount" = 980,
  "lecturersCount" = 32
WHERE id = '0a39363a-bc1f-4900-af3f-f85d7e03b60c';

UPDATE study_programs SET
  code = 'TM-S1',
  "diktiCode" = '21201',
  name = 'Teknik Mesin',
  "degreeLevel" = 'S1',
  "degreeTitle" = 'S.T.',
  accreditation = 'Unggul',
  "accreditationAgency" = 'LAM TEKNIK',
  "skAkreditasi" = 'No. 312/SK/LAM-Teknik/Ak/S/2022',
  "headOfProgram" = 'Ir. Joko Wahyono, M.T.',
  "headNip" = '19750819 200112 1 001',
  status = 'Aktif',
  "studentsCount" = 860,
  "lecturersCount" = 28
WHERE id = '1b52fba3-4cd5-4b29-8bf8-480e4a1deaee';

-- Insert additional 9 study programs
INSERT INTO study_programs (id, "facultyId", code, "diktiCode", name, "degreeLevel", "degreeTitle", accreditation, "accreditationAgency", "skAkreditasi", "headOfProgram", "headNip", status, "studentsCount", "lecturersCount", "createdAt", "updatedAt")
VALUES
  ('prodi-3', '17b7a99f-387c-4eb6-a873-58c244086075', 'RPL-S1', '55202', 'Rekayasa Perangkat Lunak', 'S1', 'S.Kom.', 'Baik Sekali', 'LAM-INFOKOM', 'No. 204/SK/LAM-INFOKOM/Ak/S/2024', 'Arif Wicaksono, M.Cs.', '19850920 201201 1 004', 'Aktif', 520, 18, NOW(), NOW()),
  ('prodi-4', '17b7a99f-387c-4eb6-a873-58c244086075', 'TRKJ-D4', '55301', 'Teknologi Rekayasa Komputer Jaringan', 'D4', 'S.Tr.Kom.', 'Unggul', 'LAM-INFOKOM', 'No. 045/SK/LAM-INFOKOM/Ak/STr/2023', 'Rahmat Hidayat, M.T.', '19800311 200604 1 003', 'Aktif', 410, 14, NOW(), NOW()),
  ('prodi-6', '3700812a-618a-4649-80a3-fb458f5c6fce', 'TE-S1', '20201', 'Teknik Elektro', 'S1', 'S.T.', 'Unggul', 'LAM TEKNIK', 'No. 289/SK/LAM-Teknik/Ak/S/2023', 'Dr. Ir. Agus Suryanto, M.T.', '19770514 200312 1 002', 'Aktif', 740, 24, NOW(), NOW()),
  ('prodi-7', '3700812a-618a-4649-80a3-fb458f5c6fce', 'TI-IND-S1', '26201', 'Teknik Industri', 'S1', 'S.T.', 'Unggul', 'LAM TEKNIK', 'No. 195/SK/LAM-Teknik/Ak/S/2024', 'Nurul Annisa, S.T., M.Sc.', '19841108 201012 2 003', 'Aktif', 690, 22, NOW(), NOW()),
  ('prodi-8', '3700812a-618a-4649-80a3-fb458f5c6fce', 'TS-S1', '22201', 'Teknik Sipil', 'S1', 'S.T.', 'Baik Sekali', 'LAM TEKNIK', 'No. 156/SK/LAM-Teknik/Ak/S/2023', 'Ir. Hendro Cahyono, M.Eng.', '19760228 200212 1 001', 'Aktif', 630, 20, NOW(), NOW()),
  ('prodi-9', 'c5897586-6d30-4f2b-8326-daf938fd945e', 'MNJ-S1', '61201', 'Manajemen Bisnis Digital', 'S1', 'S.M.', 'Unggul', 'LAMEMBA', 'No. 402/SK/LAMEMBA/Ak/S/2023', 'Dr. Siti Fauziah, S.E., M.M.', '19810625 200701 2 002', 'Aktif', 1150, 34, NOW(), NOW()),
  ('prodi-10', 'c5897586-6d30-4f2b-8326-daf938fd945e', 'AKT-S1', '62201', 'Akuntansi Keuangan Publik', 'S1', 'S.Ak.', 'Unggul', 'LAMEMBA', 'No. 378/SK/LAMEMBA/Ak/S/2024', 'Farhan Maulana, S.E., M.Ak., Ak.', '19830217 200812 1 001', 'Aktif', 780, 26, NOW(), NOW()),
  ('prodi-11', 'fac-4', 'DKV-S1', '90241', 'Desain Komunikasi Visual', 'S1', 'S.Ds.', 'Unggul', 'BAN-PT', 'No. 521/SK/BAN-PT/Ak/S/2023', 'Dimas Prasetyo, M.Sn.', '19860714 201404 1 001', 'Aktif', 890, 25, NOW(), NOW()),
  ('prodi-12', 'fac-4', 'ANM-D4', '90341', 'Animasi & Multimedia Interaktif', 'D4', 'S.Tr.Ds.', 'Baik Sekali', 'BAN-PT', 'No. 188/SK/BAN-PT/Ak/STr/2024', 'Ratna Sari Dewi, M.Ds.', '19880903 201504 2 002', 'Aktif', 380, 15, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert 10 official courses
DELETE FROM courses;
INSERT INTO courses (id, "studyProgramId", "studyProgramName", "facultyCode", code, name, "sksTeori", "sksPraktik", "totalSks", sks, semester, type, coordinator, status, description, "createdAt", "updatedAt")
VALUES
  ('mk-1', NULL, 'Seluruh Program Studi (MKDU)', 'UNIVERSITAS', 'UNI-101', 'Pendidikan Pancasila & Kewarganegaraan', 2, 0, 2, 2, 1, 'Wajib Institusi', 'Dr. Ahmad Fauzi, M.Pd.', 'Aktif', 'Membangun karakter kebangsaan, wawasan konstitusi, dan etika kehidupan berbangsa dan bernegara.', NOW(), NOW()),
  ('mk-2', NULL, 'Seluruh Program Studi (MKDU)', 'UNIVERSITAS', 'UNI-102', 'Bahasa Indonesia & Penulisan Ilmiah', 2, 0, 2, 2, 1, 'Wajib Institusi', 'Dra. Nur Indah, M.Hum.', 'Aktif', 'Keterampilan menulis artikel ilmiah, tata bahasa baku, dan sitasi akademik standar internasional.', NOW(), NOW()),
  ('mk-3', '15100fd9-aa2b-49ab-b959-32d38e947add', 'S1 Teknik Informatika', 'FASILKOM', 'TIF-101', 'Algoritma & Struktur Data', 2, 2, 4, 4, 1, 'Wajib Prodi', 'Dr. Eng. Dian Wahyudi, M.Kom.', 'Aktif', 'Dasar-dasar logika algoritma, kompleksitas waktu Big-O, struktur data array, linked-list, tree, dan graph.', NOW(), NOW()),
  ('mk-4', '15100fd9-aa2b-49ab-b959-32d38e947add', 'S1 Teknik Informatika', 'FASILKOM', 'TIF-201', 'Basis Data & SQL Lanjut', 2, 1, 3, 3, 2, 'Wajib Prodi', 'Dewi Anggraini, S.Kom., M.T.', 'Aktif', 'Desain relasional ERD, normalisasi 1NF-BCNF, indexing, store procedure, transaksi ACID, dan PostgreSQL.', NOW(), NOW()),
  ('mk-5', '15100fd9-aa2b-49ab-b959-32d38e947add', 'S1 Teknik Informatika', 'FASILKOM', 'TIF-301', 'Rekayasa Perangkat Lunak Terdistribusi', 2, 1, 3, 3, 3, 'Wajib Prodi', 'Bambang Prasetyo, S.Kom., M.Cs.', 'Aktif', 'Metodologi Agile Scrum, Clean Architecture, CI/CD, microservices, dan testing automation modern.', NOW(), NOW()),
  ('mk-6', '15100fd9-aa2b-49ab-b959-32d38e947add', 'S1 Teknik Informatika', 'FASILKOM', 'TIF-401', 'Kecerdasan Buatan & Deep Learning', 2, 1, 3, 3, 4, 'Pilihan', 'Prof. Dr. Hendra Gunawan, M.Eng.', 'Aktif', 'Jaringan saraf tiruan, Convolutional Neural Networks, Transformer, LLM, dan Computer Vision dengan PyTorch.', NOW(), NOW()),
  ('mk-7', '0a39363a-bc1f-4900-af3f-f85d7e03b60c', 'S1 Sistem Informasi', 'FASILKOM', 'SI-102', 'Arsitektur Enterprise & Digital Governance', 3, 0, 3, 3, 2, 'Wajib Prodi', 'Ir. Anita Rahmawati, M.T.', 'Aktif', 'Kerangka kerja TOGAF, Zachman, perancangan blueprint TI institusi, dan tata kelola COBIT 2019.', NOW(), NOW()),
  ('mk-8', '1b52fba3-4cd5-4b29-8bf8-480e4a1deaee', 'S1 Teknik Mesin', 'FTI', 'TM-205', 'Termodinamika & Perpindahan Kalor', 2, 1, 3, 3, 3, 'Wajib Prodi', 'Dr. Ir. Budi Hartono, M.T.', 'Aktif', 'Hukum I & II Termodinamika, siklus Rankine, Carnot, konduksi, konveksi, radiasi, dan analisis penukar kalor.', NOW(), NOW()),
  ('mk-9', 'prodi-9', 'S1 Manajemen Bisnis Digital', 'FEBD', 'MNJ-301', 'Analitika Bisnis & E-Commerce Terapan', 2, 1, 3, 3, 3, 'Wajib Prodi', 'Dr. Rina Suryani, S.E., M.M.', 'Aktif', 'Pemanfaatan data mining bisnis, customer segmentation, funnel conversion, dan Google Analytics 4.', NOW(), NOW()),
  ('mk-10', 'prodi-11', 'S1 Desain Komunikasi Visual', 'FDKV', 'DKV-202', 'Tipografi & Identitas Visual Korporasi', 1, 2, 3, 3, 2, 'Wajib Prodi', 'Fajar Nugraha, M.Ds.', 'Aktif', 'Eksplorasi anatomi huruf, hierarki visual brand identity, perancangan brand guideline korporat.', NOW(), NOW());
