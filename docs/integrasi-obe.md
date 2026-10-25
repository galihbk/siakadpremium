# API Integrasi OBE

Endpoint **baca-saja** yang dipakai sistem OBE (Outcome-Based Education) untuk menarik data akademik dari SIAKAD. Tidak ada endpoint tulis, dan tidak ada data pribadi (NIK, alamat, orang tua, keuangan).

- **Alamat dasar:** `{API_URL}/api/v1/integrations/obe`
- **Autentikasi:** `Authorization: Bearer <OBE_API_KEY>` (server-ke-server; bukan token pengguna). Tanpa atau dengan kunci salah → `401`.
- **Format:** JSON, nama kolom `snake_case`.
- **Batas laju:** tidak dikenai batas umum (sinkronisasi membaca banyak halaman berurutan); akses tetap dibatasi API key.

## Paginasi

Semua daftar (kecuali `institutions`) menerima:

| Parameter  | Isi                          | Bawaan | Maks |
| ---------- | ---------------------------- | ------ | ---- |
| `page`     | Nomor halaman, mulai dari 1  | 1      | -    |
| `per_page` | Jumlah baris per halaman     | 200    | 500  |

Respons:

```json
{
  "data": [ { "...": "..." } ],
  "meta": { "page": 1, "per_page": 200, "total": 1234, "last_page": 7 }
}
```

Baca halaman 1 sampai `meta.last_page`. Urutan baris tetap (menurut `id`), sehingga halaman tidak bergeser selama data tidak berubah.

## Ringkasan endpoint

| Endpoint                | Isi                                                        |
| ----------------------- | ---------------------------------------------------------- |
| `GET /institutions`     | Nama dan singkatan kampus                                  |
| `GET /faculties`        | Fakultas                                                   |
| `GET /study-programs`   | Program studi                                              |
| `GET /students`         | Mahasiswa                                                  |
| `GET /lecturers`        | Dosen (yang punya NIDN/NUPTK/NIP)                          |
| `GET /courses`          | Mata kuliah                                                |
| `GET /curriculum-courses` | Mata kuliah dalam kurikulum                              |
| `GET /academic-periods` | Periode akademik                                           |
| `GET /course-offerings` | Kelas (mata kuliah pada satu periode) beserta dosen pengampu |
| `GET /enrollments`      | KRS disetujui yang terikat ke kelas (mendukung penyaring)  |
| `GET /grades`           | Nilai FINAL per komponen beserta bobot kelas (mendukung penyaring) |

## Alur yang disarankan

1. Tarik data induk: `institutions`, `faculties`, `study-programs`, `lecturers`, `courses`, `curriculum-courses`, `academic-periods`.
2. Tarik `course-offerings` (kelas dan dosen pengampu), lalu `students`.
3. Tarik `enrollments`, lalu `grades`.
4. Sinkronisasi berikutnya: panggil `grades` dan `enrollments` dengan `updated_since` = waktu sinkronisasi sukses terakhir (dikurangi beberapa menit sebagai pengaman), atau dengan `period_id` untuk satu periode saja.

## Endpoint data induk

### `GET /course-offerings`

Satu baris = satu kelas (satu mata kuliah pada satu periode).

| Kolom          | Tipe     | Keterangan                                                                                   |
| -------------- | -------- | -------------------------------------------------------------------------------------------- |
| `id`           | string   | ID kelas. Dipakai sebagai `class_id` di `enrollments` dan `grades`.                          |
| `course_id`    | string   | Mata kuliah.                                                                                 |
| `period_id`    | string   | Periode akademik kelas (lihat `academic-periods`).                                           |
| `class_code`   | string   | Kode kelas, mis. `TIF-5A`.                                                                   |
| `lecturer_id`  | string?  | Dosen utama kelas. Dipertahankan agar klien lama tetap jalan.                                |
| `lecturer_ids` | string[] | **Semua** dosen yang mengajar kelas (teori + praktikum), tanpa duplikat. Pakai ini untuk menentukan siapa yang berhak melihat/menilai kelas. |

### `GET /academic-periods`

`id`, `code` (mis. `2026/2027-GANJIL`), `name`, `start_date`, `end_date`, `is_active`.

### `GET /enrollments`

KRS dengan status disetujui dan sudah terikat ke kelas.

| Kolom        | Keterangan          |
| ------------ | ------------------- |
| `id`         | ID KRS              |
| `student_id` | Mahasiswa           |
| `class_id`   | Kelas               |

Penyaring (opsional, boleh digabung): `period_id`, `class_id`, `updated_since`. Lihat [Penyaring](#penyaring).

## `GET /grades` — nilai untuk OBE

Hanya nilai berstatus **FINAL** dari KRS yang disetujui dan terikat ke kelas. Nilai draf tidak pernah dikirim.

Satu KRS menghasilkan **satu baris per komponen yang terisi**, ditambah **satu baris nilai akhir** (`component: null`). Karena itu satu halaman bisa berisi lebih banyak baris daripada `per_page`.

| Kolom              | Tipe     | Keterangan |
| ------------------ | -------- | ---------- |
| `id`               | string   | `<id KRS>:<kunci>`; stabil, dipakai untuk upsert. |
| `student_id`       | string   | Mahasiswa. |
| `class_id`         | string   | Kelas (lihat `course-offerings`). |
| `period_id`        | string   | Periode akademik nilai ini. |
| `component`        | string?  | Nama komponen apa adanya (mis. `Tugas`, `UTS`, `Praktikum`). `null` = nilai akhir. OBE menampilkan nama ini. |
| `component_code`   | string?  | Kode komponen yang stabil (mis. `TUGAS`, `UTS`). Tidak berubah walau nama diganti. `null` untuk nilai akhir. **Kunci pencocokan di OBE**: assessment di RPS yang dipetakan ke kode ini tetap cocok walau nama komponen diganti. |
| `component_weight` | number?  | Bobot komponen **di kelas itu** dalam persen, dari Kontrak Kuliah dosen. `null` bila belum ditetapkan, atau untuk nilai akhir. |
| `score`            | number   | Nilai. Skalanya mengikuti `max_score`. |
| `max_score`        | number   | Nilai maksimum. `100` untuk komponen dan nilai akhir 0-100; `4` bila nilai akhir hanya dapat dipastikan sebagai indeks 0-4. |
| `graded_at`        | string   | Waktu (ISO 8601) baris KRS terakhir berubah. Dasar sinkronisasi bertahap. |

Contoh:

```json
{
  "data": [
    {
      "id": "e1f2:UTS",
      "student_id": "s-001",
      "class_id": "c-77",
      "period_id": "p-2026-1",
      "component": "UTS",
      "component_code": "UTS",
      "component_weight": 30,
      "score": 82.5,
      "max_score": 100,
      "graded_at": "2026-12-20T03:14:00.000Z"
    },
    {
      "id": "e1f2:akhir",
      "student_id": "s-001",
      "class_id": "c-77",
      "period_id": "p-2026-1",
      "component": null,
      "component_code": null,
      "component_weight": null,
      "score": 84,
      "max_score": 100,
      "graded_at": "2026-12-20T03:14:00.000Z"
    }
  ],
  "meta": { "page": 1, "per_page": 200, "total": 1, "last_page": 1 }
}
```

### Aturan penting

- **Komponen:** bila kampus memakai skema komponen, satu baris dikirim per komponen skema (nama dan kode dari skema). Bila tidak, dikirim tiga komponen bawaan `Tugas`, `UTS`, `UAS` dari kolom nilai lama.
- **Bobot** diisi dosen per kelas di Kontrak Kuliah. Untuk skema komponen, bobot diambil per komponen dan dikirim apa adanya; untuk komponen bawaan, dari bobot `tugas`/`uts`/`uas` kontrak. Bobot **tidak dipakai OBE untuk mengubah nilai**; ia dikirim sebagai informasi (misalnya untuk memeriksa total 100%). Komponen kehadiran tidak dikirim sebagai baris sendiri.
- **Nilai akhir:** `totalScore` di SIAKAD tidak seragam (0-100 atau indeks 0-4 hasil impor Feeder). Skalanya dikirim lewat `max_score`. Baris yang skalanya tidak dapat dipastikan **dilewati**, bukan dikirim sebagai angka yang menyesatkan.
- **Nilai kosong** tidak dikirim. Mahasiswa tanpa nilai pada suatu komponen berarti belum bernilai, bukan 0.
- **Mengulang mata kuliah:** setiap pengambilan punya KRS, kelas, dan periode sendiri, sehingga nilainya terpisah.

## Penyaring

Berlaku untuk `/enrollments` dan `/grades`. Semua opsional dan dapat digabung.

| Parameter       | Isi                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------- |
| `period_id`     | Hanya periode akademik ini.                                                                   |
| `class_id`      | Hanya kelas ini.                                                                              |
| `updated_since` | Hanya yang berubah pada atau setelah waktu ini (ISO 8601, mis. `2026-12-20T00:00:00Z`). Nilai yang tidak valid diabaikan (tidak menyaring). |

Contoh:

```bash
curl -H "Authorization: Bearer $OBE_API_KEY" \
  "$API_URL/api/v1/integrations/obe/grades?period_id=p-2026-1&updated_since=2026-12-20T00:00:00Z&per_page=200&page=1"
```

## Kompatibilitas

Perubahan bersifat **menambah**: kolom lama (`id`, `student_id`, `class_id`, `component`, `score`, `max_score`, `lecturer_id`) tidak berubah arti, sehingga klien lama tetap berfungsi. Klien sebaiknya mengabaikan kolom yang tidak dikenal.

## Kode kesalahan

| Kode | Arti                                  |
| ---- | ------------------------------------- |
| 401  | API key tidak ada atau salah          |
| 5xx  | Kesalahan server; ulangi beberapa saat lagi |

Dokumentasi interaktif (Swagger) tersedia di grup **Integrasi OBE**.

## Capaian OBE di portal mahasiswa (arah sebaliknya: SIAKAD memanggil OBE)

Bila kampus memakai OBE, portal mahasiswa SIAKAD menampilkan **jaring laba-laba CPL** dan rincian capaian mahasiswa yang sedang login. Datanya dihitung OBE; SIAKAD hanya menampilkannya.

- **Menu "Capaian OBE (CPL)"** dan kartu di dashboard hanya tampil bila `OBE_API_URL` dan `OBE_PORTAL_API_KEY` diisi di server SIAKAD. Tanpa itu, portal berjalan seperti biasa dan tidak menampilkan apa pun tentang OBE.
- **Alurnya:** browser → SIAKAD `GET /api/v1/students/me/obe` (token mahasiswa) → server SIAKAD memanggil OBE `GET {OBE_API_URL}/external/students/{NIM}/obe` dengan `Authorization: Bearer <OBE_PORTAL_API_KEY>`. NIM diambil dari data SIAKAD mahasiswa yang login, bukan dari isian pengguna, dan kunci API tidak pernah sampai ke browser. Jawaban disimpan sementara 60 detik.
- **Bila OBE tidak dapat dijangkau** atau belum mengenal mahasiswa itu, portal menampilkan keterangan "tidak tersedia", tidak error.

Variabel di server SIAKAD:

| Variabel | Isi |
| --- | --- |
| `OBE_API_URL` | Alamat API OBE, mis. `http://localhost:4000` atau `https://obe-api.kampus.ac.id` |
| `OBE_PORTAL_API_KEY` | Kunci yang sama dengan `OBE_PORTAL_API_KEY` di server OBE (boleh beberapa, dipisah koma, untuk mengganti kunci tanpa henti layanan) |

### API OBE: `GET /external/students/{studentNumber}/obe`

Dijaga API key (bukan login pengguna). Tanpa kunci terpasang di OBE: `503`; kunci tidak ada atau salah: `401`; NIM tidak dikenal OBE: `404`.

Contoh jawaban (dipendekkan):

```json
{
  "student": { "studentNumber": "2402014", "name": "…", "studyProgram": "Pendidikan Ekonomi" },
  "primaryCurriculumId": "k-1",
  "curricula": [
    {
      "id": "k-1", "name": "S1 Pendidikan Ekonomi 2022", "target": { "value": 75, "source": "STUDY_PROGRAM" }, "measuredCount": 4,
      "cpl": [
        { "code": "CPL-01", "description": "…", "category": "PENGETAHUAN", "achievement": 76.69, "status": "ACHIEVED",
          "courses": [ { "code": "MKBK22226", "name": "Manajemen Pemasaran", "period": "2026/2027 Ganjil", "achievement": 81.78 } ] }
      ]
    }
  ],
  "courses": [
    { "curriculumId": "k-1", "code": "MKBK22226", "name": "…", "credits": 2, "period": "2026/2027 Ganjil",
      "assessments": [ { "name": "Tugas", "score": 85 } ],
      "subCpmk": [ { "code": "Sub-1", "description": "…", "achievement": 82.0, "status": "ACHIEVED" } ],
      "cpmk": [ … ], "cpl": [ … ] }
  ],
  "generatedAt": "2026-10-25T01:42:30.000Z"
}
```

Aturan: capaian CPL adalah rata-rata nilai CPL dari mata kuliah yang mendukungnya (tiap mata kuliah dihitung sekali, dari periode terbarunya yang bernilai), dengan rumus yang sama seperti yang dilihat dosen dan program studi. CPL yang belum punya nilai berstatus `achievement: null`, bukan 0. Hanya mata kuliah yang sudah memiliki RPS OBE dan nilai yang ikut.
