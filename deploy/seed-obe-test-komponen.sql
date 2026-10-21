-- ==============================================================================
-- SIAKAD Premium - LANJUTAN data uji OBE: komponen penilaian dinamis (jalankan SETELAH seed-obe-test.sql)
--
-- Isi : skala nilai kampus, skema komponen penilaian (Kehadiran otomatis, Tugas, UTS, UAS) yang berlaku mulai
--       2026/2027 Ganjil, bobot yang diisi DOSEN per kelas di Kontrak Kuliah (Kelas A dan B sengaja berbeda),
--       absensi 8 pertemuan per kelas, nilai per komponen, dan nilai akhir FINAL untuk periode 2026/2027.
-- Periode 2025/2026 tetap memakai cara lama (Tugas/UTS/UAS) karena nilainya sudah ada sebelum skema berlaku.
-- Aman dijalankan ulang. Wajib satu sesi psql (memakai fungsi/tabel sementara).
-- ==============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.uid(k text) RETURNS text LANGUAGE sql IMMUTABLE AS
$$ SELECT (md5('obe-seed:' || k)::uuid)::text $$;

-- ---------------------------------------------------------------- skala nilai (terhubung ke tahun akademik aktif)
INSERT INTO grade_scale_versions (id, "academicYearId", label)
SELECT pg_temp.uid('gradescale:20261'), y.id, 'Skala Nilai 2026/2027'
FROM academic_years y WHERE y.code = '20261'
ON CONFLICT (id) DO NOTHING;

INSERT INTO grade_scales (id, "versionId", letter, "minScore", "maxScore", "gradePoint", "isActive", "updatedAt")
SELECT pg_temp.uid('gradescale:20261:' || g.letter), pg_temp.uid('gradescale:20261'), g.letter, g.mn, g.mx, g.gp, true, now()
FROM (VALUES
  ('A',  85, 100,   4.0), ('A-', 80, 84.99, 3.7), ('B+', 75, 79.99, 3.3),
  ('B',  70, 74.99, 3.0), ('B-', 65, 69.99, 2.7), ('C+', 60, 64.99, 2.3),
  ('C',  55, 59.99, 2.0), ('D',  40, 54.99, 1.0), ('E',   0, 39.99, 0.0)
) AS g(letter, mn, mx, gp)
WHERE EXISTS (SELECT 1 FROM grade_scale_versions WHERE id = pg_temp.uid('gradescale:20261'))
ON CONFLICT ("versionId", letter) DO NOTHING;

-- ---------------------------------------------------------------- skema komponen (diatur Akademik; bobot TIDAK di sini)
INSERT INTO assessment_schemes (id, name, "effectiveFromYearId", notes, "updatedAt")
SELECT pg_temp.uid('scheme:20261'), 'Skema Penilaian 2026/2027', y.id, 'Data uji OBE', now()
FROM academic_years y WHERE y.code = '20261'
ON CONFLICT ("effectiveFromYearId") DO NOTHING;

INSERT INTO assessment_components (id, "schemeId", code, name, weight, source, "sortOrder")
SELECT pg_temp.uid('component:' || c.code), pg_temp.uid('scheme:20261'), c.code, c.name, 0, c.source, c.ord
FROM (VALUES
  ('kehadiran', 'Kehadiran', 'ATTENDANCE', 0),
  ('tugas',     'Tugas',     'MANUAL',     1),
  ('uts',       'UTS',       'MANUAL',     2),
  ('uas',       'UAS',       'MANUAL',     3)
) AS c(code, name, source, ord)
WHERE EXISTS (SELECT 1 FROM assessment_schemes WHERE id = pg_temp.uid('scheme:20261'))
ON CONFLICT ("schemeId", code) DO NOTHING;

-- ---------------------------------------------------------------- bobot per kelas (diisi dosen di Kontrak Kuliah)
-- Kelas A: Kehadiran 10, Tugas 20, UTS 30, UAS 40.   Kelas B: Kehadiran 15, Tugas 25, UTS 25, UAS 35.
UPDATE course_contracts ct
SET "assessmentWeights" = jsonb_build_object('components',
      CASE WHEN cc."className" = 'A'
        THEN jsonb_build_object(pg_temp.uid('component:kehadiran'), 10, pg_temp.uid('component:tugas'), 20,
                                pg_temp.uid('component:uts'), 30, pg_temp.uid('component:uas'), 40)
        ELSE jsonb_build_object(pg_temp.uid('component:kehadiran'), 15, pg_temp.uid('component:tugas'), 25,
                                pg_temp.uid('component:uts'), 25, pg_temp.uid('component:uas'), 35)
      END),
    "assessmentCriteria" = CASE WHEN cc."className" = 'A'
        THEN 'Kehadiran 10%, Tugas 20%, UTS 30%, UAS 40%.' ELSE 'Kehadiran 15%, Tugas 25%, UTS 25%, UAS 35%.' END,
    "updatedAt" = now()
FROM course_classes cc
JOIN academic_years y ON y.id = cc."academicYearId" AND y.code = '20261'
WHERE ct."courseClassId" = cc.id
  AND EXISTS (SELECT 1 FROM assessment_components WHERE id = pg_temp.uid('component:uas'));

-- ---------------------------------------------------------------- absensi: 8 pertemuan per kelas 2026/2027
INSERT INTO attendance_sessions (id, "courseClassId", "meetingNumber", date, topic, "updatedAt")
SELECT pg_temp.uid('session:' || cc.id || ':' || m), cc.id, m, DATE '2026-09-07' + (m - 1) * 7, 'Pertemuan ' || m, now()
FROM course_classes cc
JOIN academic_years y ON y.id = cc."academicYearId" AND y.code = '20261'
CROSS JOIN generate_series(1, 8) AS m
ON CONFLICT ("courseClassId", "meetingNumber") DO NOTHING;

-- sebagian besar hadir; sesekali izin/alfa (tetap per mahasiswa)
INSERT INTO attendance_records (id, "attendanceSessionId", "studentId", status, "updatedAt")
SELECT pg_temp.uid('record:' || sess.id || ':' || e."studentId"), sess.id, e."studentId",
       (CASE (abs(hashtext(sess.id || e."studentId")::bigint) % 10)
          WHEN 0 THEN 'ALFA' WHEN 1 THEN 'IZIN' ELSE 'HADIR' END)::"AttendanceStatus", now()
FROM attendance_sessions sess
JOIN course_classes cc ON cc.id = sess."courseClassId"
JOIN academic_years y ON y.id = cc."academicYearId" AND y.code = '20261'
JOIN course_enrollments e ON e."courseClassId" = cc.id
ON CONFLICT ("attendanceSessionId", "studentId") DO NOTHING;

-- ---------------------------------------------------------------- nilai per komponen + nilai akhir
CREATE TEMP TABLE _cs ON COMMIT DROP AS
SELECT e.id AS enrollment_id, e."studentId", c.id AS component_id, c.code,
       CASE c.code
         WHEN 'kehadiran' THEN (SELECT COALESCE(round(100.0 * count(*) FILTER (WHERE r.status = 'HADIR') / NULLIF(count(*), 0)), 0)
                                FROM attendance_sessions s2 LEFT JOIN attendance_records r ON r."attendanceSessionId" = s2.id AND r."studentId" = e."studentId"
                                WHERE s2."courseClassId" = e."courseClassId")
         WHEN 'tugas' THEN 60 + (abs(hashtext(e.id || 'tugas')::bigint) % 36)
         WHEN 'uts'   THEN 55 + (abs(hashtext(e.id || 'uts')::bigint) % 41)
         WHEN 'uas'   THEN 55 + (abs(hashtext(e.id || 'uas')::bigint) % 41)
       END::float AS score,
       (ct."assessmentWeights" -> 'components' ->> c.id)::float AS weight
FROM course_enrollments e
JOIN course_classes cc ON cc.id = e."courseClassId"
JOIN academic_years y ON y.id = cc."academicYearId" AND y.code = '20261'
JOIN course_contracts ct ON ct."courseClassId" = cc.id
JOIN assessment_components c ON c."schemeId" = pg_temp.uid('scheme:20261');

INSERT INTO enrollment_component_scores (id, "enrollmentId", "componentId", score, "updatedAt")
SELECT pg_temp.uid('score:' || enrollment_id || ':' || code), enrollment_id, component_id, score, now()
FROM _cs
ON CONFLICT ("enrollmentId", "componentId") DO NOTHING;

UPDATE course_enrollments e
SET "totalScore" = t.total,
    "gradeLetter" = g.letter,
    "gradePoint"  = g."gradePoint",
    "gradeStatus" = 'FINAL',
    "updatedAt"   = now()
FROM (SELECT enrollment_id, round((sum(score * weight) / 100)::numeric, 1)::float AS total FROM _cs GROUP BY enrollment_id) t
JOIN grade_scales g ON g."versionId" = pg_temp.uid('gradescale:20261')
 AND round((SELECT sum(c2.score * c2.weight) / 100 FROM _cs c2 WHERE c2.enrollment_id = t.enrollment_id)::numeric, 1) BETWEEN g."minScore" AND g."maxScore" + 0.0099
WHERE e.id = t.enrollment_id;

COMMIT;

-- Cek cepat (harus 4 komponen x 24 KRS = 96 baris nilai komponen, 24 KRS FINAL di 2026/2027):
--   SELECT count(*) FROM enrollment_component_scores;
--   SELECT cc."className", c.code, e."gradeLetter", e."totalScore" FROM course_enrollments e
--   JOIN course_classes cc ON cc.id = e."courseClassId" JOIN courses c ON c.id = e."courseId"
--   JOIN academic_years y ON y.id = e."academicYearId" AND y.code = '20261' ORDER BY 2,1 LIMIT 10;
