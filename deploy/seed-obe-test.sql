-- ==============================================================================
-- SIAKAD Premium - data uji untuk menguji sinkronisasi OBE (instance KOSONG saja!)
--
-- Isi : 1 fakultas, 1 prodi, 1 kurikulum, 4 mata kuliah, 4 dosen, 12 mahasiswa, 2 periode akademik,
--       8 kelas (tiap MK punya Kelas A dan B, diajar dosen berbeda), jadwal, kontrak kuliah (RPS acuan sama
--       untuk Kelas A dan B), KRS disetujui, dan nilai FINAL untuk periode 2025/2026 Ganjil.
-- Login: semua akun memakai kata sandi  admin123
--        dosen: andi@uji.ac.id, budi@uji.ac.id, citra@uji.ac.id, dedi@uji.ac.id
--        mhs  : mhs01@uji.ac.id ... mhs12@uji.ac.id
--
-- Aman dijalankan ulang (ID dibuat deterministik, bentrok diabaikan). JANGAN dijalankan di database kampus
-- sungguhan. Jalankan SETELAH API menyala sekali (tabel dibuat `prisma db push`):
--   docker exec -i obe-postgres-prod psql -U siakad -d siakad_premium < seed-obe-test.sql
-- ==============================================================================
BEGIN;

-- helper: ID tetap dari sebuah kunci, mis. uid('student:251010001')
CREATE OR REPLACE FUNCTION pg_temp.uid(k text) RETURNS text LANGUAGE sql IMMUTABLE AS
$$ SELECT (md5('obe-seed:' || k)::uuid)::text $$;

-- ---------------------------------------------------------------- institusi
INSERT INTO landing_page_settings (id, "campusName", "campusShortName", "updatedAt")
VALUES ('default-setting', 'Kampus Uji OBE', 'UJI', now())
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------- fakultas & prodi
INSERT INTO faculties (id, code, name, "updatedAt")
VALUES (pg_temp.uid('faculty:FTI'), 'FTI', 'Fakultas Teknologi Informasi', now())
ON CONFLICT (code) DO NOTHING;

INSERT INTO study_programs (id, "facultyId", code, "diktiCode", name, "degreeLevel", "degreeTitle", accreditation, "updatedAt")
SELECT pg_temp.uid('prodi:TIF'), f.id, 'TIF', '55201', 'Teknik Informatika', 'S1', 'S.Kom.', 'Baik', now()
FROM faculties f WHERE f.code = 'FTI'
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------- kurikulum (nama prodi HARUS sama dengan nama prodi)
INSERT INTO curriculums (id, code, name, "studyProgram", "degreeLevel", "facultyCode", "startYear", status, "updatedAt")
VALUES (pg_temp.uid('curriculum:K2024'), 'K2024-TIF', 'Kurikulum OBE 2024 Teknik Informatika', 'Teknik Informatika', 'S1', 'FTI', 2024, 'Aktif', now())
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------- mata kuliah
INSERT INTO courses (id, "studyProgramId", "studyProgramName", "facultyCode", "curriculumId", code, name, "sksTeori", "sksPraktik", "totalSks", sks, semester, type, "updatedAt")
SELECT pg_temp.uid('course:' || c.code), sp.id, sp.name, 'FTI', cu.id, c.code, c.name, c.sks, 0, c.sks, c.sks, c.sem, 'Wajib Prodi', now()
FROM (VALUES
  ('TIF101', 'Algoritma dan Pemrograman', 3, 1),
  ('TIF102', 'Matematika Diskrit',        3, 1),
  ('TIF201', 'Basis Data',                3, 3),
  ('TIF202', 'Struktur Data',             3, 3)
) AS c(code, name, sks, sem)
CROSS JOIN study_programs sp
CROSS JOIN curriculums cu
WHERE sp.code = 'TIF' AND cu.code = 'K2024-TIF'
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------- periode akademik
INSERT INTO academic_years (id, code, name, "semesterType", "isActive", "startDate", "endDate", "isKrsOpen", "isGradeLocked", status, "updatedAt")
VALUES
  (pg_temp.uid('year:20251'), '20251', '2025/2026', 'ODD', false, '2025-09-01', '2026-02-28', false, true,  'Arsip', now()),
  (pg_temp.uid('year:20261'), '20261', '2026/2027', 'ODD', true,  '2026-09-01', '2027-02-28', false, false, 'Aktif', now())
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------- dosen (NIDN wajib agar tampil di OBE)
INSERT INTO users (id, email, "passwordHash", "fullName", role, "isActive", "updatedAt")
SELECT pg_temp.uid('user:' || d.email), d.email, '$2b$10$UD4qVbRjR41vq2XccUV5wuxHT/D1RvMFtYu0Q.MzMFj8sJDKj6pYq', d.name, 'LECTURER'::"Role", true, now()
FROM (VALUES
  ('andi@uji.ac.id',  'Andi Pratama'),
  ('budi@uji.ac.id',  'Budi Santoso'),
  ('citra@uji.ac.id', 'Citra Dewi'),
  ('dedi@uji.ac.id',  'Dedi Kurniawan')
) AS d(email, name)
ON CONFLICT (email) DO NOTHING;

INSERT INTO lecturers (id, "userId", "studyProgramId", nidn, "titlePrefix", "titleSuffix", "updatedAt")
SELECT pg_temp.uid('lecturer:' || d.nidn), u.id, sp.id, d.nidn, d.prefix, d.suffix, now()
FROM (VALUES
  ('andi@uji.ac.id',  '0411018801', 'Dr.', 'M.Kom.'),
  ('budi@uji.ac.id',  '0415058502', NULL,  'M.T.'),
  ('citra@uji.ac.id', '0420128003', NULL,  'M.Cs.'),
  ('dedi@uji.ac.id',  '0408079004', NULL,  'M.Kom.')
) AS d(email, nidn, prefix, suffix)
JOIN users u ON u.email = d.email
CROSS JOIN study_programs sp WHERE sp.code = 'TIF'
ON CONFLICT ("userId") DO NOTHING;

-- ---------------------------------------------------------------- mahasiswa (12 orang, angkatan 2025)
INSERT INTO users (id, email, "passwordHash", "fullName", role, "isActive", "updatedAt")
SELECT pg_temp.uid('user:' || 'mhs' || lpad(n::text, 2, '0') || '@uji.ac.id'),
       'mhs' || lpad(n::text, 2, '0') || '@uji.ac.id',
       '$2b$10$UD4qVbRjR41vq2XccUV5wuxHT/D1RvMFtYu0Q.MzMFj8sJDKj6pYq',
       (ARRAY['Rina Amelia','Fajar Nugroho','Salsabila Putri','Rizky Ramadhan','Nadia Safitri','Bagas Prasetyo',
              'Intan Permata','Yoga Pratama','Dewi Lestari','Hendra Wijaya','Anisa Rahma','Eko Saputra'])[n],
       'STUDENT'::"Role", true, now()
FROM generate_series(1, 12) AS n
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (id, "userId", "studyProgramId", nim, gender, "entryYear", "currentSemester", status, "updatedAt")
SELECT pg_temp.uid('student:' || '25101' || lpad(n::text, 4, '0')), u.id, sp.id, '25101' || lpad(n::text, 4, '0'),
       CASE WHEN n IN (2, 4, 6, 8, 12) THEN 'MALE'::"Gender" ELSE 'FEMALE'::"Gender" END,
       2025, 3, 'ACTIVE'::"StudentStatus", now()
FROM generate_series(1, 12) AS n
JOIN users u ON u.email = 'mhs' || lpad(n::text, 2, '0') || '@uji.ac.id'
CROSS JOIN study_programs sp WHERE sp.code = 'TIF'
ON CONFLICT ("userId") DO NOTHING;

-- ---------------------------------------------------------------- kelas + jadwal (tiap MK: Kelas A dan Kelas B, dosen berbeda)
INSERT INTO course_classes (id, "courseId", "academicYearId", "className", day, "startTime", "endTime", "lecturerId", quota, status, "updatedAt")
SELECT pg_temp.uid('class:' || k.course || ':' || k.year || ':' || k.cls),
       c.id, y.id, k.cls, k.day, k.st, k.en, l.id, 40,
       CASE WHEN k.year = '20261' THEN 'Berjalan' ELSE 'Selesai' END, now()
FROM (VALUES
  ('TIF101', '20251', 'A', 'andi@uji.ac.id',  'Senin',  '08:00', '10:30'),
  ('TIF101', '20251', 'B', 'budi@uji.ac.id',  'Senin',  '10:30', '13:00'),
  ('TIF102', '20251', 'A', 'citra@uji.ac.id', 'Selasa', '08:00', '10:30'),
  ('TIF102', '20251', 'B', 'dedi@uji.ac.id',  'Selasa', '10:30', '13:00'),
  ('TIF201', '20261', 'A', 'andi@uji.ac.id',  'Rabu',   '08:00', '10:30'),
  ('TIF201', '20261', 'B', 'citra@uji.ac.id', 'Rabu',   '10:30', '13:00'),
  ('TIF202', '20261', 'A', 'budi@uji.ac.id',  'Kamis',  '08:00', '10:30'),
  ('TIF202', '20261', 'B', 'dedi@uji.ac.id',  'Kamis',  '10:30', '13:00')
) AS k(course, year, cls, lecturer_email, day, st, en)
JOIN courses c ON c.code = k.course
JOIN academic_years y ON y.code = k.year
JOIN users u ON u.email = k.lecturer_email
JOIN lecturers l ON l."userId" = u.id
ON CONFLICT ("courseId", "academicYearId", "className") DO NOTHING;

-- ---------------------------------------------------------------- kontrak kuliah / RPS (sama untuk Kelas A & B)
INSERT INTO course_contracts (id, "courseClassId", "rpsCode", description, "graduateLearningOutcomes", "learningOutcomes", "subCpmk",
                              "studyMaterials", "teachingMethods", "assessmentCriteria", "assessmentWeights", "references",
                              "isPublished", "p2mStatus", "preparedDate", "updatedAt")
SELECT pg_temp.uid('contract:' || cc.id), cc.id, 'RPS/' || c.code || '/2026',
       'Mata kuliah ' || c.name || ' pada Program Studi Teknik Informatika.',
       'CPL-1, CPL-2',
       'CPMK-1 Menjelaskan konsep dasar ' || c.name || '; CPMK-2 Menerapkan ' || c.name || ' pada studi kasus.',
       'Sub-CPMK-1.1 Memahami konsep; Sub-CPMK-2.1 Mengimplementasikan solusi.',
       'Konsep dasar, studi kasus, proyek kecil.',
       'Kuliah tatap muka, diskusi, praktikum.',
       'Tugas 20%, UTS 30%, UAS 35%, Kehadiran 15%.',
       '{"tugas":20,"uts":30,"uas":35,"kehadiran":15}'::jsonb,
       'Buku ajar utama ' || c.name || '.',
       true, 'DISAHKAN', now(), now()
FROM course_classes cc
JOIN courses c ON c.id = cc."courseId"
WHERE c.code IN ('TIF101', 'TIF102', 'TIF201', 'TIF202')
ON CONFLICT ("courseClassId") DO NOTHING;

-- ---------------------------------------------------------------- KRS disetujui + nilai
-- Mahasiswa 1-6 masuk Kelas A, 7-12 Kelas B. Periode 2025/2026 Ganjil: nilai FINAL (nilai acak tetap per mahasiswa & MK).
-- Periode 2026/2027 Ganjil: KRS disetujui, nilai belum diisi (DRAFT) -- untuk dicoba input lewat portal dosen.
CREATE TEMP TABLE _krs ON COMMIT DROP AS
SELECT s.id AS student_id, s.nim, cc.id AS class_id, c.id AS course_id, y.id AS year_id, y.code AS year_code, c.code AS course_code,
       60 + (abs(hashtext(s.nim || c.code || 'a')::bigint) % 36) AS tugas,
       55 + (abs(hashtext(s.nim || c.code || 'b')::bigint) % 41) AS uts,
       55 + (abs(hashtext(s.nim || c.code || 'c')::bigint) % 41) AS uas
FROM students s
JOIN generate_series(1, 12) AS n ON s.nim = '25101' || lpad(n::text, 4, '0')
JOIN courses c ON c.code IN ('TIF101', 'TIF102', 'TIF201', 'TIF202')
JOIN course_classes cc ON cc."courseId" = c.id AND cc."className" = CASE WHEN n <= 6 THEN 'A' ELSE 'B' END
JOIN academic_years y ON y.id = cc."academicYearId";

INSERT INTO course_enrollments (id, "studentId", "courseId", "courseClassId", "academicYearId", status,
                                "assignmentScore", "midtermScore", "finalScore", "totalScore", "gradeLetter", "gradePoint", "gradeStatus", "updatedAt")
SELECT pg_temp.uid('krs:' || k.nim || ':' || k.course_code), k.student_id, k.course_id, k.class_id, k.year_id, 'APPROVED'::"EnrollmentStatus",
       CASE WHEN k.year_code = '20251' THEN k.tugas END,
       CASE WHEN k.year_code = '20251' THEN k.uts END,
       CASE WHEN k.year_code = '20251' THEN k.uas END,
       t.total,
       CASE WHEN t.total IS NULL THEN NULL WHEN t.total >= 85 THEN 'A' WHEN t.total >= 80 THEN 'A-' WHEN t.total >= 75 THEN 'B+'
            WHEN t.total >= 70 THEN 'B' WHEN t.total >= 65 THEN 'B-' WHEN t.total >= 60 THEN 'C+' WHEN t.total >= 55 THEN 'C'
            WHEN t.total >= 40 THEN 'D' ELSE 'E' END,
       CASE WHEN t.total IS NULL THEN NULL WHEN t.total >= 85 THEN 4.0 WHEN t.total >= 80 THEN 3.7 WHEN t.total >= 75 THEN 3.3
            WHEN t.total >= 70 THEN 3.0 WHEN t.total >= 65 THEN 2.7 WHEN t.total >= 60 THEN 2.3 WHEN t.total >= 55 THEN 2.0
            WHEN t.total >= 40 THEN 1.0 ELSE 0.0 END,
       CASE WHEN k.year_code = '20251' THEN 'FINAL' ELSE 'DRAFT' END,
       now()
FROM _krs k
CROSS JOIN LATERAL (
  SELECT CASE WHEN k.year_code = '20251'
              THEN round((0.20 * k.tugas + 0.30 * k.uts + 0.35 * k.uas + 0.15 * 90)::numeric, 1)::float END AS total
) t
ON CONFLICT ("studentId", "courseId", "academicYearId") DO NOTHING;

COMMIT;

-- Cek cepat:
--   SELECT cc."className", c.code, u."fullName" AS dosen, count(e.id) AS mhs
--   FROM course_classes cc JOIN courses c ON c.id = cc."courseId"
--   JOIN lecturers l ON l.id = cc."lecturerId" JOIN users u ON u.id = l."userId"
--   LEFT JOIN course_enrollments e ON e."courseClassId" = cc.id GROUP BY 1,2,3 ORDER BY 2,1;
