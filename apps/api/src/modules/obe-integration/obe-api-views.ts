/**
 * Antarmuka data baca-saja untuk OBE yang dipasang LANGSUNG di database SIAKAD (skema `obe_api`).
 *
 * Isinya sama dengan yang dikirim endpoint REST integrasi OBE (nama kolom snake_case yang sama), jadi OBE membacanya
 * dengan pemeta yang sama. Bedanya OBE tidak lewat HTTP: ia membaca view ini lewat akun database `obe_reader` yang
 * HANYA boleh membaca view di skema ini (tidak ada akses ke tabel SIAKAD mana pun).
 *
 * Aturan:
 *  - Ini adalah JANJI kepada OBE. Bila kolom tabel SIAKAD berubah, view di sini diperbarui pada perubahan yang sama.
 *  - Skema dibuat ulang dari nol setiap API menyala (DROP lalu CREATE), sehingga `prisma db push` tidak pernah
 *    tertahan oleh view yang bergantung pada kolom yang diubah (skrip deploy juga menjatuhkan skema ini sebelum push).
 *  - Akun `obe_reader` dibuat TANPA hak login. Hak login baru diberikan saat OBE benar-benar dipasang:
 *    `ALTER ROLE obe_reader LOGIN PASSWORD '...'`.
 *  - View berjalan dengan hak pemilik, jadi `obe_reader` tidak membutuhkan hak apa pun pada tabel.
 */

/** Dipanggil sebelum `prisma db push` agar view tidak menahan perubahan kolom. */
export const OBE_API_DROP_SQL = 'DROP SCHEMA IF EXISTS obe_api CASCADE';

/** Alamat publik SIAKAD (tanpa garis miring akhir) sebagai literal SQL yang aman; kosong bila tidak diatur. */
const publicBase = (): string => (process.env.SIAKAD_PUBLIC_URL ?? '').trim().replace(/\/+$/, '').replace(/'/g, "''");

const isNumber = (expr: string) => `(${expr} ~ '^[0-9]+(\\.[0-9]+)?$')`;

export const OBE_API_VIEWS: { name: string; sql: string }[] = [
  {
    // Alamat dan situs kampus; alamat logo dibuat absolut bila SIAKAD_PUBLIC_URL diisi (di SIAKAD logo disimpan sebagai path).
    name: 'institutions',
    sql: `SELECT id::text AS id, "campusShortName" AS code, "campusName" AS name,
                 NULLIF(btrim("contactAddress"), '') AS address, NULLIF(btrim(website), '') AS website,
                 CASE WHEN "logoUrl" IS NULL OR "logoUrl" = '' THEN NULL
                      WHEN "logoUrl" ~* '^https?://' THEN "logoUrl"
                      ELSE '__PUBLIC_BASE__' || "logoUrl" END AS logo_url
          FROM landing_page_settings`,
  },
  {
    name: 'faculties',
    sql: `SELECT id::text AS id, code, name, "updatedAt" AS updated_at FROM faculties`,
  },
  {
    name: 'study_programs',
    sql: `SELECT id::text AS id, "facultyId"::text AS faculty_id, code, name, "degreeLevel"::text AS degree,
                 "updatedAt" AS updated_at
          FROM study_programs`,
  },
  {
    name: 'students',
    sql: `SELECT s.id::text AS id, s.nim AS student_number, u."fullName" AS full_name, u.email,
                 s."studyProgramId"::text AS study_program_id, s.status::text AS status, s."entryYear" AS entry_year,
                 s."updatedAt" AS updated_at
          FROM students s JOIN users u ON u.id = s."userId"`,
  },
  {
    // Semua dosen, bukan hanya yang punya NIDN: kodenya NIDN, lalu NUPTK, NIP, dan terakhir email.
    name: 'lecturers',
    sql: `SELECT l.id::text AS id,
                 COALESCE(l.nidn, l.nuptk, l.nip, u.email) AS nidn,
                 l.nidn AS nidn_only, l.nuptk, l.nip,
                 concat_ws('', CASE WHEN l."titlePrefix" IS NOT NULL AND l."titlePrefix" <> '' THEN l."titlePrefix" || ' ' END,
                           u."fullName",
                           CASE WHEN l."titleSuffix" IS NOT NULL AND l."titleSuffix" <> '' THEN ', ' || l."titleSuffix" END) AS full_name,
                 u.email, l."studyProgramId"::text AS study_program_id, l."updatedAt" AS updated_at
          FROM lecturers l JOIN users u ON u.id = l."userId"`,
  },
  {
    name: 'courses',
    sql: `SELECT id::text AS id, code, name, sks AS credits, semester, "updatedAt" AS updated_at FROM courses`,
  },
  {
    // Satu baris = satu mata kuliah pada satu kurikulum. Program studi kurikulum dicari lewat nama prodi di kurikulum,
    // lalu program studi mata kuliahnya (sama dengan endpoint REST).
    name: 'curriculum_courses',
    sql: `SELECT k.id::text || ':' || c.id::text AS id,
                 k.id::text AS curriculum_id, k.code AS curriculum_code, k.name AS curriculum_name,
                 k."startYear" AS curriculum_year, (k.status = 'Aktif') AS curriculum_active,
                 COALESCE(sp.id, c."studyProgramId")::text AS study_program_id,
                 c.id::text AS course_id, c.semester, c.sks AS credits,
                 CASE WHEN c.type ~* 'pilihan' THEN 'ELECTIVE' ELSE 'MANDATORY' END AS course_type,
                 GREATEST(c."updatedAt", k."updatedAt") AS updated_at
          FROM courses c
          JOIN curriculums k ON k.id = c."curriculumId"
          LEFT JOIN study_programs sp ON lower(btrim(sp.name)) = lower(btrim(k."studyProgram"))
          WHERE COALESCE(sp.id, c."studyProgramId") IS NOT NULL`,
  },
  {
    name: 'academic_periods',
    sql: `SELECT id::text AS id,
                 name || '-' || CASE "semesterType"::text WHEN 'ODD' THEN 'GANJIL' WHEN 'EVEN' THEN 'GENAP' WHEN 'SHORT' THEN 'PENDEK' ELSE "semesterType"::text END AS code,
                 name || ' ' || CASE "semesterType"::text WHEN 'ODD' THEN 'Ganjil' WHEN 'EVEN' THEN 'Genap' WHEN 'SHORT' THEN 'Pendek' ELSE "semesterType"::text END AS name,
                 to_char("startDate", 'YYYY-MM-DD') AS start_date, to_char("endDate", 'YYYY-MM-DD') AS end_date,
                 "isActive" AS is_active, "updatedAt" AS updated_at
          FROM academic_years`,
  },
  {
    // lecturer_ids = semua dosen kelas (dosen utama + dosen praktikum), dosen utama lebih dulu.
    name: 'course_offerings',
    sql: `SELECT id::text AS id, "courseId"::text AS course_id, "academicYearId"::text AS period_id,
                 "className" AS class_code, "lecturerId"::text AS lecturer_id,
                 array_remove(ARRAY[
                   "lecturerId"::text,
                   CASE WHEN "practiceLecturerId" IS DISTINCT FROM "lecturerId" THEN "practiceLecturerId"::text END
                 ], NULL) AS lecturer_ids,
                 "updatedAt" AS updated_at
          FROM course_classes`,
  },
  {
    name: 'enrollments',
    sql: `SELECT id::text AS id, "studentId"::text AS student_id, "courseClassId"::text AS class_id,
                 "academicYearId"::text AS period_id, "updatedAt" AS updated_at
          FROM course_enrollments
          WHERE status = 'APPROVED' AND "courseClassId" IS NOT NULL`,
  },
  {
    // Komponen nilai yang dipakai di tiap kelas (skema komponen kampus, atau tiga komponen bawaan), dengan bobot
    // yang ditetapkan dosen di Kontrak Kuliah kelas itu (null bila belum).
    name: 'grade_components',
    sql: `SELECT DISTINCT ON (e."courseClassId", ac.id)
                 e."courseClassId"::text || ':' || ac.code AS id,
                 e."courseClassId"::text AS class_id, ac.code AS component_code, ac.name AS component,
                 CASE WHEN ${isNumber(`(cc."assessmentWeights"->'components'->>ac.id)`)}
                      THEN (cc."assessmentWeights"->'components'->>ac.id)::float END AS component_weight
          FROM enrollment_component_scores s
          JOIN course_enrollments e ON e.id = s."enrollmentId"
          JOIN assessment_components ac ON ac.id = s."componentId"
          LEFT JOIN course_contracts cc ON cc."courseClassId" = e."courseClassId"
          WHERE e.status = 'APPROVED' AND e."courseClassId" IS NOT NULL AND e."gradeStatus" = 'FINAL'`,
  },
  {
    // Nilai FINAL: satu baris per komponen yang terisi + satu baris nilai akhir (component NULL).
    // Skala nilai akhir mengikuti endpoint REST: > 4 berarti 0-100; sama dengan indeks berarti 0-4; selain itu dilewati.
    name: 'grades',
    sql: `WITH fin AS (
            SELECT * FROM course_enrollments
            WHERE status = 'APPROVED' AND "courseClassId" IS NOT NULL AND "gradeStatus" = 'FINAL'
          ), w AS (
            SELECT f.id AS enrollment_id, cc."assessmentWeights" AS weights
            FROM fin f LEFT JOIN course_contracts cc ON cc."courseClassId" = f."courseClassId"
          )
          -- komponen skema kampus
          SELECT f.id::text || ':' || ac.code AS id, f."studentId"::text AS student_id, f."courseClassId"::text AS class_id,
                 f."academicYearId"::text AS period_id, ac.name AS component, ac.code AS component_code,
                 CASE WHEN ${isNumber(`(w.weights->'components'->>ac.id)`)} THEN (w.weights->'components'->>ac.id)::float END AS component_weight,
                 s.score::float AS score, 100 AS max_score, f."updatedAt" AS updated_at
          FROM fin f
          JOIN enrollment_component_scores s ON s."enrollmentId" = f.id
          JOIN assessment_components ac ON ac.id = s."componentId"
          JOIN w ON w.enrollment_id = f.id
          UNION ALL
          -- komponen bawaan (tugas, UTS, UAS) untuk KRS tanpa komponen skema
          SELECT f.id::text || ':' || d.key, f."studentId"::text, f."courseClassId"::text, f."academicYearId"::text,
                 d.label, d.code,
                 CASE WHEN ${isNumber(`(w.weights->>d.key)`)} THEN (w.weights->>d.key)::float END,
                 d.score::float, 100, f."updatedAt"
          FROM fin f
          JOIN w ON w.enrollment_id = f.id
          CROSS JOIN LATERAL (VALUES
            ('tugas', 'TUGAS', 'Tugas', f."assignmentScore"),
            ('uts', 'UTS', 'UTS', f."midtermScore"),
            ('uas', 'UAS', 'UAS', f."finalScore")
          ) AS d(key, code, label, score)
          WHERE d.score IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM enrollment_component_scores x WHERE x."enrollmentId" = f.id)
          UNION ALL
          -- nilai akhir
          SELECT f.id::text || ':akhir', f."studentId"::text, f."courseClassId"::text, f."academicYearId"::text,
                 NULL, NULL, NULL,
                 CASE WHEN f."totalScore" > 4 THEN f."totalScore"::float ELSE f."gradePoint"::float END,
                 CASE WHEN f."totalScore" > 4 THEN 100 ELSE 4 END,
                 f."updatedAt"
          FROM fin f
          WHERE f."totalScore" IS NOT NULL
            AND (f."totalScore" > 4 OR (f."gradePoint" IS NOT NULL AND abs(f."totalScore" - f."gradePoint") < 0.01))`,
  },
  {
    // Akun yang boleh masuk OBE. Hash kata sandi ada di sini HANYA agar OBE dapat memeriksa login; kolom ini tidak
    // pernah diteruskan ke browser. Peran selain SUPER_ADMIN, ADMIN_PRODI, dan LECTURER tidak memberi akses OBE.
    name: 'users',
    sql: `SELECT u.id::text AS id, u.email, u."fullName" AS full_name, u.role::text AS role, u."isActive" AS is_active,
                 u."passwordHash" AS password_hash, u."mustChangePassword" AS must_change_password,
                 u."studyProgramId"::text AS study_program_id,
                 l.id::text AS lecturer_id, l.nidn, l.nuptk, l.nip, u."updatedAt" AS updated_at
          FROM users u LEFT JOIN lecturers l ON l."userId" = u.id
          WHERE u.role::text IN ('SUPER_ADMIN', 'ADMIN_PRODI', 'LECTURER')`,
  },
];

/** Perintah pembuatan ulang skema, berurutan. Setiap elemen dijalankan sebagai satu perintah. */
export function obeApiCreateStatements(): string[] {
  return [
    OBE_API_DROP_SQL,
    'CREATE SCHEMA obe_api',
    // SIAKAD_PUBLIC_URL dibaca saat dipasang (bukan saat berkas dimuat), supaya variabel lingkungan sudah terisi.
    ...OBE_API_VIEWS.map((v) => `CREATE VIEW obe_api.${v.name} AS ${v.sql.replace('__PUBLIC_BASE__', publicBase())}`),
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'obe_reader') THEN CREATE ROLE obe_reader NOLOGIN; END IF;
     END $$`,
    'REVOKE ALL ON SCHEMA obe_api FROM PUBLIC',
    'GRANT USAGE ON SCHEMA obe_api TO obe_reader',
    'GRANT SELECT ON ALL TABLES IN SCHEMA obe_api TO obe_reader',
  ];
}
