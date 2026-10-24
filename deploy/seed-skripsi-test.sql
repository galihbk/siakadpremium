-- ============================================================================
-- Data uji alur Tugas Akhir / Skripsi
-- Pengajuan proposal -> plotting pembimbing -> bimbingan proposal -> ACC -> daftar sempro -> jadwal sempro
-- -> bimbingan skripsi -> ACC -> daftar ujian skripsi -> jadwal ujian -> input nilai.
--
-- Isi:
--   * 5 dosen uji (dosen.skripsi1..5@uji.ac.id): dipakai sebagai pembimbing dan penguji.
--   * 8 mahasiswa uji (mhs.skripsi1..8@uji.ac.id), masing-masing berhenti di tahap berbeda,
--     sehingga setiap langkah bisa diuji tanpa mengulang dari awal.
--   * Semua akun memakai kata sandi:  Password123!   (login mahasiswa memakai NIM atau email)
--
-- Syarat: sudah ada minimal 1 program studi aktif dan 1 tahun akademik. Aman dijalankan berulang
-- (data yang sudah ada dilewati). Hapus data uji dengan blok "HAPUS" di bagian bawah.
--
-- Jalankan:
--   docker exec -i siakad-postgres-prod psql -U siakad -d siakad_premium < deploy/seed-skripsi-test.sql
-- ============================================================================

DO $$
DECLARE
  pw        text := '$2b$10$N0YpyFlo.JFnUoxrbvZ/guy5XOt2.gAjjQK1szTY//.1chCzIboC6';
  prodi_id  text;
  d         text[];          -- id dosen 1..5
  did       text;
  uid       text;
  sid       text;
  pid       text;
  def_id    text;
  i         int;
  stage_of  text[] := ARRAY[
    NULL,                    -- 1: belum mengajukan proposal (uji dari awal)
    'PROPOSAL_SUBMITTED',    -- 2: menunggu plotting pembimbing
    'PROPOSAL_GUIDANCE',     -- 3: bimbingan proposal
    'PROPOSAL_APPROVED',     -- 4: proposal di-ACC, siap daftar sempro
    'SEMPRO_SCHEDULED',      -- 5: sempro terjadwal
    'SKRIPSI_GUIDANCE',      -- 6: sempro selesai, bimbingan skripsi
    'SKRIPSI_APPROVED',      -- 7: skripsi di-ACC, siap daftar ujian
    'UJIAN_SCHEDULED'        -- 8: ujian terjadwal, siap input nilai
  ];
  titles    text[] := ARRAY[
    'Pengaruh Model Pembelajaran Berbasis Proyek terhadap Hasil Belajar Siswa Sekolah Dasar',
    'Analisis Motivasi Belajar Siswa pada Pembelajaran Daring di Sekolah Dasar',
    'Pengembangan Media Pembelajaran Interaktif Matematika Kelas IV Sekolah Dasar',
    'Efektivitas Metode Diskusi Kelompok terhadap Keterampilan Berbicara Siswa',
    'Implementasi Kurikulum Merdeka dalam Pembelajaran Bahasa Indonesia di SD',
    'Peningkatan Literasi Membaca Melalui Gerakan Literasi Sekolah',
    'Pengaruh Penggunaan Alat Peraga terhadap Pemahaman Konsep Pecahan Siswa SD',
    'Studi Kasus Penerapan Penilaian Autentik pada Pembelajaran Tematik'
  ];
  names     text[] := ARRAY['Anisa Rahmawati','Bagas Prasetyo','Citra Lestari','Dimas Saputra','Eka Wulandari','Fajar Nugroho','Gita Permata','Hadi Kurniawan'];
BEGIN
  SELECT id INTO prodi_id FROM study_programs ORDER BY code LIMIT 1;
  IF prodi_id IS NULL THEN
    RAISE EXCEPTION 'Belum ada program studi. Buat program studi dulu.';
  END IF;

  -- ---------------------------------------------------------------- dosen uji
  d := ARRAY[]::text[];
  FOR i IN 1..5 LOOP
    SELECT id INTO uid FROM users WHERE email = 'dosen.skripsi' || i || '@uji.ac.id';
    IF uid IS NULL THEN
      uid := gen_random_uuid()::text;
      INSERT INTO users (id, email, "passwordHash", "fullName", role, "isActive", "updatedAt")
      VALUES (uid, 'dosen.skripsi' || i || '@uji.ac.id', pw,
              (ARRAY['Rina Marlina','Budi Santoso','Siti Nurhaliza','Agus Setiawan','Dewi Anggraini'])[i],
              'LECTURER', true, now());
    END IF;
    SELECT id INTO did FROM lecturers WHERE "userId" = uid;
    IF did IS NULL THEN
      did := gen_random_uuid()::text;
      INSERT INTO lecturers (id, "userId", "studyProgramId", nidn, "titlePrefix", "titleSuffix", phone, "updatedAt")
      VALUES (did, uid, prodi_id, '99000000' || LPAD(i::text, 2, '0'),
              CASE WHEN i IN (2, 4) THEN 'Dr.' ELSE NULL END, 'M.Pd.', '08123000000' || i, now());
    END IF;
    d := d || did;
  END LOOP;

  -- ---------------------------------------------------------------- mahasiswa uji
  FOR i IN 1..8 LOOP
    SELECT id INTO uid FROM users WHERE email = 'mhs.skripsi' || i || '@uji.ac.id';
    IF uid IS NULL THEN
      uid := gen_random_uuid()::text;
      INSERT INTO users (id, email, "passwordHash", "fullName", role, "isActive", "updatedAt")
      VALUES (uid, 'mhs.skripsi' || i || '@uji.ac.id', pw, names[i], 'STUDENT', true, now());
    END IF;

    SELECT id INTO sid FROM students WHERE "userId" = uid;
    IF sid IS NULL THEN
      sid := gen_random_uuid()::text;
      INSERT INTO students (id, "userId", "studyProgramId", nim, "advisorLecturerId", "entryYear", "currentSemester", status, phone, "updatedAt")
      VALUES (sid, uid, prodi_id, '2201' || LPAD(i::text, 4, '0'), d[1], 2022, 7, 'ACTIVE', '08129000000' || i, now());
    END IF;

    -- Proyek skripsi sesuai tahap target (mahasiswa 1 sengaja tanpa proyek)
    IF stage_of[i] IS NOT NULL AND NOT EXISTS (SELECT 1 FROM thesis_projects WHERE "studentId" = sid) THEN
      pid := gen_random_uuid()::text;
      INSERT INTO thesis_projects (id, "studentId", title, abstract, stage, "supervisor1Id", "supervisor2Id", "supervisorAssignedAt", "submittedAt", "updatedAt")
      VALUES (
        pid, sid, titles[i],
        'Penelitian ini bertujuan untuk mengkaji ' || lower(titles[i]) || '. Metode yang digunakan adalah penelitian kuantitatif dengan teknik pengumpulan data observasi dan tes.',
        stage_of[i]::"ThesisStage",
        CASE WHEN i >= 3 THEN d[1] END,
        CASE WHEN i >= 3 THEN d[2] END,
        CASE WHEN i >= 3 THEN now() - interval '30 days' END,
        now() - interval '40 days', now()
      );

      -- Catatan bimbingan proposal yang dicatat dosen pembimbing (tahap 3 dst.)
      IF i >= 3 THEN
        INSERT INTO thesis_guidances (id, "projectId", phase, "lecturerId", chapter, topic, notes, "meetingDate", status)
        VALUES
          (gen_random_uuid()::text, pid, 'PROPOSAL'::"ThesisPhase", d[1], 'Bab I', 'Bab I',
             'Membahas latar belakang dan rumusan masalah. Rumusan masalah perlu dipertajam agar sesuai tujuan penelitian.', now() - interval '25 days', 'RECORDED'),
          (gen_random_uuid()::text, pid, 'PROPOSAL'::"ThesisPhase", d[1], 'Bab II', 'Bab II',
             'Revisi Bab I dan pembahasan kajian pustaka. Landasan teori ditambah rujukan terbaru.', now() - interval '15 days', 'RECORDED'),
          (gen_random_uuid()::text, pid, 'PROPOSAL'::"ThesisPhase", d[2], 'Bab I', 'Bab I',
             'Pembahasan tata tulis dan konsistensi judul dengan rumusan masalah.', now() - interval '20 days', 'RECORDED'),
          (gen_random_uuid()::text, pid, 'PROPOSAL'::"ThesisPhase", d[2], 'Bab III', 'Bab III',
             'Arahan metode penelitian dan teknik analisis data.', now() - interval '12 days', 'RECORDED');
      END IF;

      -- ACC proposal oleh kedua pembimbing (tahap 4 dst.)
      IF i >= 4 THEN
        INSERT INTO thesis_approvals (id, "projectId", phase, "lecturerId", "approvedAt")
        VALUES (gen_random_uuid()::text, pid, 'PROPOSAL', d[1], now() - interval '10 days'),
               (gen_random_uuid()::text, pid, 'PROPOSAL', d[2], now() - interval '10 days');
      END IF;

      -- Seminar proposal: terjadwal (tahap 5) atau sudah selesai (tahap 6 dst.)
      IF i >= 5 THEN
        def_id := gen_random_uuid()::text;
        INSERT INTO thesis_defenses (id, "projectId", type, status, "registeredAt", "scheduledAt", location, result, score, "gradeLetter", "updatedAt")
        VALUES (def_id, pid, 'SEMPRO'::"ThesisDefenseType",
                (CASE WHEN i = 5 THEN 'SCHEDULED' ELSE 'DONE' END)::"ThesisDefenseStatus",
                now() - interval '8 days',
                CASE WHEN i = 5 THEN now() + interval '7 days' ELSE now() - interval '5 days' END,
                'Ruang Seminar Lantai 2',
                CASE WHEN i = 5 THEN NULL ELSE 'LULUS' END,
                CASE WHEN i = 5 THEN NULL ELSE 82 END,
                CASE WHEN i = 5 THEN NULL ELSE 'A-' END,
                now());
        INSERT INTO thesis_defense_examiners (id, "defenseId", "lecturerId", role)
        VALUES (gen_random_uuid()::text, def_id, d[3], 'KETUA'),
               (gen_random_uuid()::text, def_id, d[4], 'PENGUJI'),
               (gen_random_uuid()::text, def_id, d[5], 'PENGUJI');
      END IF;

      -- Catatan bimbingan skripsi yang dicatat dosen pembimbing (tahap 6 dst.)
      IF i >= 6 THEN
        INSERT INTO thesis_guidances (id, "projectId", phase, "lecturerId", chapter, topic, notes, "meetingDate", status)
        VALUES (gen_random_uuid()::text, pid, 'SKRIPSI'::"ThesisPhase", d[1], 'Bab III', 'Bab III',
                'Pembahasan instrumen penelitian dan teknik pengumpulan data. Instrumen sudah divalidasi.', now() - interval '4 days', 'RECORDED'),
               (gen_random_uuid()::text, pid, 'SKRIPSI'::"ThesisPhase", d[2], 'Bab IV', 'Bab IV',
                'Pembahasan hasil pengolahan data dan interpretasi.', now() - interval '3 days', 'RECORDED');
        IF i >= 7 THEN
          INSERT INTO thesis_guidances (id, "projectId", phase, "lecturerId", chapter, topic, notes, "meetingDate", status)
          VALUES (gen_random_uuid()::text, pid, 'SKRIPSI'::"ThesisPhase", d[1], 'Bab IV', 'Bab IV',
                  'Pembahasan hasil penelitian dan kesimpulan Bab V. Naskah sudah layak diujikan.', now() - interval '2 days', 'RECORDED');
        END IF;
      END IF;

      -- ACC skripsi (tahap 7 dst.)
      IF i >= 7 THEN
        INSERT INTO thesis_approvals (id, "projectId", phase, "lecturerId", "approvedAt")
        VALUES (gen_random_uuid()::text, pid, 'SKRIPSI', d[1], now() - interval '1 day'),
               (gen_random_uuid()::text, pid, 'SKRIPSI', d[2], now() - interval '1 day');
      END IF;

      -- Ujian skripsi terjadwal (tahap 8)
      IF i = 8 THEN
        def_id := gen_random_uuid()::text;
        INSERT INTO thesis_defenses (id, "projectId", type, status, "registeredAt", "scheduledAt", location, "updatedAt")
        VALUES (def_id, pid, 'UJIAN'::"ThesisDefenseType", 'SCHEDULED'::"ThesisDefenseStatus", now() - interval '1 day', now() + interval '10 days', 'Ruang Sidang Utama', now());
        INSERT INTO thesis_defense_examiners (id, "defenseId", "lecturerId", role)
        VALUES (gen_random_uuid()::text, def_id, d[3], 'KETUA'),
               (gen_random_uuid()::text, def_id, d[4], 'PENGUJI'),
               (gen_random_uuid()::text, def_id, d[5], 'PENGUJI');
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Riwayat akademik & KRS skripsi (agar mahasiswa uji realistis):
--   * ~126 SKS mata kuliah lulus (nilai FINAL) dari semester 1-6, tersebar di tahun akademik 2022/2023 - 2025/2026.
--   * KRS semester berjalan: mata kuliah SKRIPSI (kelas "SKRIPSI-UJI", tanpa jadwal tetap, dosen pengampu = dosen uji 1),
--     status disetujui. Seminar proposal tahap 1-5 mengikuti mata kuliah "Seminar Proposal Skripsi" bila kelasnya ada.
-- ============================================================================
DO $$
DECLARE
  r        record;
  c        record;
  yr_ids   text[];
  yr_id    text;
  active_y text;
  skripsi  text;
  cls_id   text;
  lec_id   text;
  total    int;
  k        int;
  letters  text[] := ARRAY['A','A-','B+','B','A','B+','A-','B'];
  points   numeric[] := ARRAY[4.0,3.7,3.3,3.0,4.0,3.3,3.7,3.0];
  scores   numeric[] := ARRAY[88,82,78,73,90,77,83,72];
  idx      int;
BEGIN
  SELECT id INTO active_y FROM academic_years WHERE "isActive" LIMIT 1;
  IF active_y IS NULL THEN RAISE NOTICE 'Tidak ada tahun akademik aktif: bagian KRS dilewati.'; END IF;

  SELECT array_agg(id ORDER BY code) INTO yr_ids
  FROM academic_years WHERE code IN ('20221','20222','20231','20232','20241','20242','20251','20252');

  -- Dosen pengampu kelas skripsi = dosen uji 1
  SELECT l.id INTO lec_id FROM lecturers l JOIN users u ON u.id = l."userId" WHERE u.email = 'dosen.skripsi1@uji.ac.id';

  FOR r IN
    SELECT s.id AS sid, s."studyProgramId" AS pid, right(u.email, length(u.email)) AS email,
           regexp_replace(split_part(u.email, '@', 1), '\D', '', 'g')::int AS n
    FROM students s JOIN users u ON u.id = s."userId"
    WHERE u.email LIKE 'mhs.skripsi%@uji.ac.id'
  LOOP
    -- 1. Riwayat nilai: mata kuliah prodi (kecuali skripsi/seminar/tugas akhir) sampai ~126 SKS
    IF yr_ids IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM course_enrollments e WHERE e."studentId" = r.sid AND e."gradeStatus" = 'FINAL') THEN
      total := 0; k := 0;
      FOR c IN
        SELECT id, sks FROM courses
        WHERE "studyProgramId" = r.pid AND sks > 0
          AND name !~* '(skripsi|proposal|seminar|tugas akhir|kkn|kuliah kerja)'
        ORDER BY code
      LOOP
        EXIT WHEN total >= 126;
        idx := ((k + r.n) % 8) + 1;
        yr_id := yr_ids[(k % array_length(yr_ids, 1)) + 1];
        INSERT INTO course_enrollments (id, "studentId", "courseId", "academicYearId", status,
                                        "totalScore", "gradeLetter", "gradePoint", "gradeStatus", "updatedAt")
        VALUES (gen_random_uuid()::text, r.sid, c.id, yr_id, 'APPROVED'::"EnrollmentStatus",
                scores[idx], letters[idx], points[idx], 'FINAL', now())
        ON CONFLICT DO NOTHING;
        total := total + c.sks;
        k := k + 1;
      END LOOP;
    END IF;

    -- 2. KRS semester berjalan: SKRIPSI
    IF active_y IS NOT NULL THEN
      SELECT id INTO skripsi FROM courses WHERE "studyProgramId" = r.pid AND name ~* '^skripsi$' ORDER BY code LIMIT 1;
      IF skripsi IS NOT NULL THEN
        SELECT id INTO cls_id FROM course_classes WHERE "courseId" = skripsi AND "academicYearId" = active_y AND "className" = 'SKRIPSI-UJI';
        IF cls_id IS NULL THEN
          cls_id := gen_random_uuid()::text;
          INSERT INTO course_classes (id, "courseId", "academicYearId", "className", "isFlexibleSchedule", "lecturerId", "updatedAt")
          VALUES (cls_id, skripsi, active_y, 'SKRIPSI-UJI', true, lec_id, now());
        END IF;
        IF NOT EXISTS (SELECT 1 FROM course_enrollments WHERE "studentId" = r.sid AND "courseId" = skripsi AND "academicYearId" = active_y) THEN
          INSERT INTO course_enrollments (id, "studentId", "courseId", "courseClassId", "academicYearId", status, "updatedAt")
          VALUES (gen_random_uuid()::text, r.sid, skripsi, cls_id, active_y, 'APPROVED'::"EnrollmentStatus", now());
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Ringkasan hasil
SELECT u.email AS mahasiswa, s.nim, COALESCE(p.stage::text, '(belum mengajukan proposal)') AS tahap,
       (SELECT COALESCE(SUM(c.sks), 0) FROM course_enrollments e JOIN courses c ON c.id = e."courseId"
         WHERE e."studentId" = s.id AND e."gradeStatus" = 'FINAL') AS sks_lulus,
       (SELECT string_agg(c.name, ', ') FROM course_enrollments e JOIN courses c ON c.id = e."courseId"
         JOIN academic_years ay ON ay.id = e."academicYearId" AND ay."isActive"
         WHERE e."studentId" = s.id) AS krs_berjalan
FROM students s
JOIN users u ON u.id = s."userId"
LEFT JOIN thesis_projects p ON p."studentId" = s.id
WHERE u.email LIKE 'mhs.skripsi%@uji.ac.id'
ORDER BY u.email;

-- ---------------------------------------------------------------------------
-- HAPUS data uji (jalankan terpisah bila perlu):
--   DELETE FROM users WHERE email LIKE 'mhs.skripsi%@uji.ac.id' OR email LIKE 'dosen.skripsi%@uji.ac.id';
--   (mahasiswa, dosen, proyek skripsi, bimbingan, dan jadwal ikut terhapus lewat relasi cascade)
-- ---------------------------------------------------------------------------
