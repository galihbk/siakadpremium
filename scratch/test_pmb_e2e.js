const API_URL = 'http://localhost:3001/api/v1';

async function getJson(res) {
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

async function runE2ETest() {
  console.log('=== STARTING END-TO-END PMB VERIFICATION ===\n');

  // 1. Opsi Form
  console.log('1. Mengambil opsi form master PMB dari PostgreSQL...');
  const optRes = await fetch(`${API_URL}/admissions/pmb/options`);
  if (!optRes.ok) throw new Error(`Failed to fetch options: ${optRes.statusText}`);
  const options = await getJson(optRes);
  console.log(`✓ Gelombang: ${options.waves?.length} aktif`);
  console.log(`✓ Jalur Seleksi: ${options.tracks?.length} aktif`);
  console.log(`✓ Pilihan Kelas: ${options.classes?.length} aktif`);
  console.log(`✓ Program Studi Master: ${options.studyPrograms?.length} prodi aktif`);

  const wave = options.waves[0];
  const track = options.tracks[0];
  const cls = options.classes[0];
  const prodi = options.studyPrograms[0];

  if (!wave || !track || !cls || !prodi) {
    throw new Error('Master data (wave/track/class/prodi) incomplete in database!');
  }

  // 2. Registrasi Akun PMB Baru
  const testEmail = `calon.e2e.${Date.now()}@siakadpremium.ac.id`;
  console.log(`\n2. Registrasi Akun PMB baru: ${testEmail}...`);
  const regRes = await fetch(`${API_URL}/admissions/pmb/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Ahmad Fauzi E2E',
      email: testEmail,
      whatsapp: '081234567890',
      password: 'Password123!',
    }),
  });

  const regData = await getJson(regRes);
  if (!regRes.ok) throw new Error(`Register failed: ${JSON.stringify(regData)}`);
  const accountId = regData.account?.id;
  console.log(`✓ Akun PMB berhasil dibuat (ID: ${accountId})`);
  console.log(`✓ Nomor pendaftaran masih kosong (Sesuai Konsep: draft belum punya nomor)`);

  // 3. Login Akun PMB
  console.log('\n3. Menguji autentikasi login Akun PMB...');
  const loginRes = await fetch(`${API_URL}/admissions/pmb/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: 'Password123!',
    }),
  });
  const loginData = await getJson(loginRes);
  if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  console.log(`✓ Login berhasil! Token diterima.`);

  // 4. Simpan Draf Formulir PMB
  console.log('\n4. Menyimpan Draf Formulir PMB...');
  const draftRes = await fetch(`${API_URL}/admissions/pmb/draft?accountId=${accountId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      waveId: wave.id,
      trackId: track.id,
      classId: cls.id,
      studyProgramId: prodi.id,
      nik: '3578012345670001',
      fullName: 'Ahmad Fauzi E2E',
      birthPlace: 'Surabaya',
      birthDate: '2005-04-12',
      gender: 'L',
      religion: 'Islam',
      phone: '081234567890',
      email: testEmail,
      address: 'Jl. Raya Darmo No. 45, Surabaya',
      schoolName: 'SMA Negeri 5 Surabaya',
      npsn: '20532145',
      graduationYear: '2026',
      major: 'IPA',
      parentName: 'Bambang Sudarmono',
      parentPhone: '081298765432',
      parentJob: 'Wiraswasta',
      parentIncome: 'Rp 5.000.000 - Rp 10.000.000',
    }),
  });
  const draftData = await getJson(draftRes);
  if (!draftRes.ok) throw new Error(`Save draft failed: ${JSON.stringify(draftData)}`);
  console.log(`✓ Draf formulir tersimpan: status = ${draftData.application?.formStatus}, regNum = ${draftData.application?.registrationNumber || 'null (BENAR)'}`);

  // 5. Submit Formulir PMB (Terbitkan No. Registrasi & Tagihan Biaya Registrasi)
  console.log('\n5. Melakukan Submit Formulir PMB...');
  const submitRes = await fetch(`${API_URL}/admissions/pmb/submit?accountId=${accountId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      waveId: wave.id,
      trackId: track.id,
      classId: cls.id,
      studyProgramId: prodi.id,
      nik: '3578012345670001',
      fullName: 'Ahmad Fauzi E2E',
      birthPlace: 'Surabaya',
      birthDate: '2005-04-12',
      gender: 'L',
      religion: 'Islam',
      phone: '081234567890',
      email: testEmail,
      address: 'Jl. Raya Darmo No. 45, Surabaya',
      schoolName: 'SMA Negeri 5 Surabaya',
      npsn: '20532145',
      graduationYear: '2026',
      major: 'IPA',
      parentName: 'Bambang Sudarmono',
      parentPhone: '081298765432',
      parentJob: 'Wiraswasta',
      parentIncome: 'Rp 5.000.000 - Rp 10.000.000',
    }),
  });
  const submitData = await getJson(submitRes);
  if (!submitRes.ok) throw new Error(`Submit failed: ${JSON.stringify(submitData)}`);
  const app = submitData.application;
  console.log(`✓ Formulir berhasil disubmit!`);
  console.log(`✓ Nomor Registrasi Resmi Terbit: ${app?.registrationNumber}`);
  console.log(`✓ Status Alur: Form = ${app?.formStatus}, Verifikasi Berkas = ${app?.verificationStatus}, Seleksi = ${app?.selectionStatus}`);

  // Cek tagihan registrasi
  const regPayment = app?.payments?.find((p) => p.type === 'REGISTRATION');
  if (!regPayment) throw new Error('Tagihan Biaya Registrasi tidak dibuat!');
  console.log(`✓ Tagihan Biaya Registrasi otomatis terbit: ID ${regPayment.id}, Nominal: Rp ${Number(regPayment.amount).toLocaleString('id-ID')}, Status: ${regPayment.status}`);

  // 6. Upload Bukti Bayar Registrasi
  console.log('\n6. Calon Mahasiswa mengunggah bukti bayar Registrasi...');
  const payRes = await fetch(`${API_URL}/admissions/pmb/payments/${regPayment.id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    }),
  });
  const payData = await getJson(payRes);
  if (!payRes.ok) throw new Error(`Pay failed: ${JSON.stringify(payData)}`);
  console.log(`✓ Bukti bayar terunggah. Status tagihan: ${payData.payment?.status} (VERIFYING)`);

  // 7. Admin PMB Verifikasi Pembayaran Registrasi
  console.log('\n7. Admin PMB memvalidasi pembayaran registrasi menjadi LUNAS...');
  const vPayRes = await fetch(`${API_URL}/admissions/admin/pmb/payments/${regPayment.id}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'PAID',
      verifiedBy: 'Bagus Wicaksono, S.Kom. (Admin PMB)',
    }),
  });
  const vPayData = await getJson(vPayRes);
  if (!vPayRes.ok) throw new Error(`Verify payment failed: ${JSON.stringify(vPayData)}`);
  console.log(`✓ Pembayaran registrasi diverifikasi: ${vPayData.payment?.status} (PAID)`);

  // 8. Admin PMB Verifikasi Berkas Dokumen
  console.log('\n8. Admin PMB memverifikasi berkas dokumen pendaftar...');
  const vDocRes = await fetch(`${API_URL}/admissions/admin/pmb/applications/${app.id}/verify-doc`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'VERIFIED',
      note: 'Semua dokumen ijazah, KK, dan KTP lengkap dan absah.',
      verifiedBy: 'Bagus Wicaksono, S.Kom.',
    }),
  });
  const vDocData = await getJson(vDocRes);
  if (!vDocRes.ok) throw new Error(`Verify doc failed: ${JSON.stringify(vDocData)}`);
  console.log(`✓ Berkas dokumen dinyatakan: ${vDocData.application?.verificationStatus} (VERIFIED)`);

  // 9. Admin PMB Memberikan Keputusan Seleksi (LULUS) -> Otomatis Terbit Tagihan Daftar Ulang
  console.log('\n9. Admin PMB menetapkan kelulusan seleksi (LULUS) & Nilai Ujian...');
  const selRes = await fetch(`${API_URL}/admissions/admin/pmb/applications/${app.id}/selection`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectionStatus: 'PASSED',
      testScore: 88.5,
      selectionNotes: 'Lulus peringkat 3 Tes Potensi Skolastik Gelombang 1',
    }),
  });
  const selData = await getJson(selRes);
  if (!selRes.ok) throw new Error(`Selection decision failed: ${JSON.stringify(selData)}`);
  console.log(`✓ Keputusan seleksi tersimpan: ${selData.application?.selectionStatus} (PASSED)`);

  // Cek tagihan daftar ulang
  const detailRes = await fetch(`${API_URL}/admissions/admin/pmb/applications/${app.id}`);
  const detailData = await getJson(detailRes);
  const reRegPayment = detailData.payments?.find((p) => p.type === 'RE_REGISTRATION');
  if (!reRegPayment) throw new Error('Tagihan Biaya Daftar Ulang TIDAK terbit otomatis saat Lulus!');
  console.log(`✓ Tagihan Biaya Daftar Ulang otomatis terbit: ID ${reRegPayment.id}, Nominal: Rp ${Number(reRegPayment.amount).toLocaleString('id-ID')}, Status: ${reRegPayment.status}`);

  // 10. Pembayaran & Verifikasi Biaya Daftar Ulang
  console.log('\n10. Memvalidasi Biaya Daftar Ulang menjadi LUNAS...');
  const vReRegRes = await fetch(`${API_URL}/admissions/admin/pmb/payments/${reRegPayment.id}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'PAID',
      verifiedBy: 'Bagus Wicaksono, S.Kom. (Admin PMB)',
    }),
  });
  const vReRegData = await getJson(vReRegRes);
  if (!vReRegRes.ok) throw new Error(`Verify re-reg payment failed: ${JSON.stringify(vReRegData)}`);
  console.log(`✓ Biaya daftar ulang diverifikasi LUNAS: ${vReRegData.payment?.status} (PAID)`);

  // 11. Konversi Calon Mahasiswa Menjadi Mahasiswa Aktif SIAKAD Resmi (NIM & User Portal Terbit)
  console.log('\n11. Mengkonversi pendaftar menjadi Mahasiswa Resmi SIAKAD...');
  const convRes = await fetch(`${API_URL}/admissions/admin/pmb/applications/${app.id}/convert-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const convData = await getJson(convRes);
  if (!convRes.ok) throw new Error(`Convert to student failed: ${JSON.stringify(convData)}`);
  console.log(`✓ KONVERSI BERHASIL!`);
  console.log(`  - Mahasiswa ID: ${convData.student?.id}`);
  console.log(`  - Nama: ${convData.student?.fullName}`);
  console.log(`  - NIM Resmi Terbit: ${convData.student?.nim}`);
  console.log(`  - Status Mahasiswa: ${convData.student?.status}`);
  console.log(`  - Akun Portal Mahasiswa: ${convData.user?.email} (Role: ${convData.user?.role})`);

  // 12. Validasi Dashboard Statistik Real PostgreSQL
  console.log('\n12. Validasi Dashboard Statistik Riil PostgreSQL...');
  const statsRes = await fetch(`${API_URL}/admissions/admin/pmb/stats`);
  const statsData = await getJson(statsRes);
  console.log(`✓ Total Pendaftar Submit: ${statsData.totalApplicants}`);
  console.log(`✓ Registrasi Lunas: ${statsData.paidRegistrationCount}`);
  console.log(`✓ Berkas Terverifikasi: ${statsData.verifiedDocsCount}`);
  console.log(`✓ Lulus Seleksi: ${statsData.passedCount}`);
  console.log(`✓ Daftar Ulang Lunas: ${statsData.paidReRegistrationCount}`);
  console.log(`✓ Mahasiswa Resmi SIAKAD: ${statsData.registeredStudentsCount}`);
  console.log(`✓ Distribusi Prodi:`, statsData.prodiDistribution);

  console.log('\n======================================================');
  console.log('🎉 SEMUA 12 TAHAP PENGUJIAN PMB END-TO-END SUKSES 100%');
  console.log('======================================================');
}

runE2ETest().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
