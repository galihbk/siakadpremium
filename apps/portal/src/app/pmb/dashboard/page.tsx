'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  GraduationCap,
  LogOut,
  Mail,
  Phone,
  Printer,
  School,
  User,
  Search,
  AlertCircle,
  Award,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Save,
  Sparkles,
  Building,
  Check,
  CreditCard,
  Upload,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  AdmissionApplicationItem,
  AdmissionBatchItem,
  AdmissionRegistrationTypeItem,
  AdmissionTrackItem,
  AdmissionClassItem,
  AdmissionPaymentItem,
} from '@siakad/types';

interface RegionItem {
  id: string;
  name: string;
  province_id?: string;
  regency_id?: string;
  district_id?: string;
}

interface SchoolSearchResult {
  id: string;
  npsn: string;
  name: string;
  rawName?: string;
  bentuk: string;
  status: string;
  province: string;
  regency: string;
  district: string;
  address?: string;
}

function toTitleCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  const preserveUpper = new Set([
    'RT', 'RW', 'KTP', 'KK', 'SMA', 'SMK', 'MA', 'SMP', 'MTS', 'SD',
    'IPA', 'IPS', 'MIPA', 'D3', 'D4', 'S1', 'S2', 'S3', 'DKI', 'DI', 'DIY', 'RI',
    'PTN', 'PTS', 'NPSN', 'NIK', 'NISN', 'PNS', 'TNI', 'POLRI', 'BUMN', 'BUMD'
  ]);

  return str
    .split(' ')
    .map((word) => {
      if (!word) return '';
      const cleanWord = word.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (preserveUpper.has(cleanWord)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * DEGREE_LEVEL_INFO: label UI dan flag perilaku per degreeLevel.
 * Ini adalah satu-satunya tempat konfigurasi front-end per jenjang.
 * Data degreeLevel itu sendiri DATANG DARI DATABASE (options.studyPrograms).
 * Tambahkan entry baru di sini jika kampus membuka jenjang baru (D2, Profesi, Sp1, dsb).
 */
const DEGREE_LEVEL_INFO: Record<string, {
  title: string;
  subtitle: string;
  desc: string;
  badge: string;
  kipEligible: boolean;    // apakah jenjang ini bisa daftar KIP-Kuliah
  showTrackClass: boolean; // apakah jenjang ini perlu pilih Jalur & Kelas
}> = {
  S1: {
    title: 'Sarjana (S1)',
    subtitle: 'Program Sarjana Strata 1',
    desc: 'Tersedia opsi Beasiswa KIP-Kuliah, Mahasiswa Baru / Transfer, serta Kelas Reguler & Karyawan.',
    badge: 'Reguler & KIP',
    kipEligible: true,
    showTrackClass: true,
  },
  D4: {
    title: 'Sarjana Terapan (D4)',
    subtitle: 'Program Diploma IV / Vokasi',
    desc: 'Program vokasi setara sarjana dengan fokus pada kompetensi terapan dan industri.',
    badge: 'Vokasi D4',
    kipEligible: true,
    showTrackClass: true,
  },
  D3: {
    title: 'Diploma (D3)',
    subtitle: 'Program Diploma III',
    desc: 'Program vokasi 3 tahun dengan kurikulum berorientasi keahlian terapan profesional.',
    badge: 'Vokasi D3',
    kipEligible: true,
    showTrackClass: false,
  },
  S2: {
    title: 'Pascasarjana Magister (S2)',
    subtitle: 'Program Pascasarjana Strata 2',
    desc: 'Program studi magister lanjutan untuk lulusan S1/D4 dengan kurikulum riset & profesional terpadu.',
    badge: 'Pascasarjana',
    kipEligible: false,
    showTrackClass: false,
  },
  S3: {
    title: 'Pascasarjana Doktoral (S3)',
    subtitle: 'Program Doktoral Strata 3',
    desc: 'Program riset akademik doktoral tertinggi untuk pengembangan ilmu, riset, dan kepakaran.',
    badge: 'Riset Doktoral',
    kipEligible: false,
    showTrackClass: false,
  },
};

/** Ambil info UI untuk degreeLevel. Kembalikan null jika tidak dikonfigurasi di DEGREE_LEVEL_INFO */
function getDegreeInfo(degreeLevel: string) {
  return DEGREE_LEVEL_INFO[degreeLevel] ?? null;
}

export default function PmbDashboardPage() {
  const router = useRouter();
  const apiBaseUrl = getApiBaseUrl();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [application, setApplication] = useState<AdmissionApplicationItem | null>(null);

  // Wilayah Indonesia (Emsifa API) States
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [isManualVillage, setIsManualVillage] = useState(false);

  // School Autocomplete States
  const [schoolSuggestions, setSchoolSuggestions] = useState<SchoolSearchResult[]>([]);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const schoolSearchDebounce = useRef<any>(null);

  const [addressState, setAddressState] = useState({
    country: 'Indonesia',
    provinceId: '',
    provinceName: '',
    regencyId: '',
    regencyName: '',
    districtId: '',
    districtName: '',
    villageId: '',
    villageName: '',
    rtRw: '',
    postalCode: '',
    streetAddress: '',
  });

  // Master Options dari PostgreSQL
  const [options, setOptions] = useState<{
    waves: AdmissionBatchItem[];
    registrationTypes: AdmissionRegistrationTypeItem[];
    tracks: AdmissionTrackItem[];
    classes: AdmissionClassItem[];
    studyPrograms: Array<{
      id: string;
      code: string;
      name: string;
      degreeLevel: string;
      facultyName: string;
      accreditation?: string;
    }>;
  }>({
    waves: [],
    registrationTypes: [],
    tracks: [],
    classes: [],
    studyPrograms: [],
  });

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isEditingSubmitted, setIsEditingSubmitted] = useState(false);

  // Upload Payment Proof modal/state
  const [selectedPayment, setSelectedPayment] = useState<AdmissionPaymentItem | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank BNI');
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);

  // Form State — selectedJenjang kosong ('') saat pertama load, user harus pilih sendiri
  const [selectedJenjang, setSelectedJenjang] = useState<string>('');
  const [formData, setFormData] = useState({
    waveId: '',
    registrationTypeId: '',
    trackId: '',
    classId: '',
    studyProgramId: '',
    isKip: false,

    // Pribadi
    nik: '',
    fullName: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki',
    religion: 'Islam',
    phone: '',
    email: '',
    address: '',

    // Sekolah
    schoolName: '',
    npsn: '',
    nisn: '',
    graduationYear: '2026',
    major: 'IPA',

    // Ortu
    parentName: '',
    parentPhone: '',
    parentJob: '',
    parentIncome: 'Rp3.000.000 - Rp5.000.000',

    // Dokumen
    fileKtp: '',
    fileKk: '',
    fileIjazah: '',
    fileFoto: '',
    fileTambahan: '',

    statementAgreed: false,
  });

  // Load user session & fetch options + profile
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      let storedAccount: any = null;
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('pmb_account_session') || localStorage.getItem('pmb_applicant_session');
        if (raw) {
          storedAccount = JSON.parse(raw);
          setAccount(storedAccount);
        }
      }

      if (!storedAccount || !storedAccount.id) {
        router.push('/pmb/login');
        return;
      }

      // Restore addressState dari localStorage (supaya tidak hilang setelah simpan draf)
      try {
        const addrKey = `pmb_address_state_${storedAccount.id || storedAccount.email}`;
        const savedAddr = localStorage.getItem(addrKey);
        if (savedAddr) {
          const parsed = JSON.parse(savedAddr);
          // Hanya restore jika ada data bermakna (bukan default kosong semua)
          if (parsed && (parsed.provinceId || parsed.streetAddress)) {
            setAddressState(parsed);
          }
        }
      } catch {}


      // Fetch options & profile in parallel
      const accountQuery = encodeURIComponent(storedAccount.id || storedAccount.email || '');
      const [optRes, meRes] = await Promise.all([
        fetch(`${apiBaseUrl}/admissions/pmb/options`, { cache: 'no-store' }),
        fetch(`${apiBaseUrl}/admissions/pmb/me?accountId=${accountQuery}`, { cache: 'no-store' }),
      ]);

      if (optRes.ok) {
        const optJson = await optRes.json();
        const optData = optJson.data !== undefined ? optJson.data : optJson;
        setOptions(optData);

        // Pre-select default wave, registrationType, track, class
        if (optData.waves && optData.waves.length > 0) {
          const defaultWave = optData.waves.find((w: any) => w.isDefault) || optData.waves[0];
          setFormData((prev) => ({
            ...prev,
            waveId: prev.waveId || defaultWave.id,
          }));
        }
        if (optData.registrationTypes && optData.registrationTypes.length > 0) {
          const defaultReg = optData.registrationTypes.find((r: any) => !r.isKip) || optData.registrationTypes[0];
          setFormData((prev) => ({
            ...prev,
            registrationTypeId: prev.registrationTypeId || defaultReg.id,
            isKip: prev.registrationTypeId ? prev.isKip : defaultReg.isKip,
          }));
        }
        if (optData.tracks && optData.tracks.length > 0) {
          setFormData((prev) => ({
            ...prev,
            trackId: prev.trackId || optData.tracks[0].id,
          }));
        }
        if (optData.classes && optData.classes.length > 0) {
          setFormData((prev) => ({
            ...prev,
            classId: prev.classId || optData.classes[0].id,
          }));
        }
      }

      if (meRes.ok) {
        const meJson = await meRes.json();
        const meData = meJson.data !== undefined ? meJson.data : meJson;
        if (meData.account) {
          setAccount(meData.account);
        }
        if (meData.application) {
          setApplication(meData.application);
          // Prepopulate form data with existing application
          const app = meData.application;
          setFormData((prev) => ({
            ...prev,
            waveId: app.waveId || prev.waveId,
            registrationTypeId: app.registrationTypeId || prev.registrationTypeId,
            trackId: app.trackId || prev.trackId,
            classId: app.classId || prev.classId,
            studyProgramId: app.studyProgramId || prev.studyProgramId,
            isKip: app.isKip ?? false,
            nik: app.nik || '',
            fullName: app.fullName || storedAccount.fullName || '',
            birthPlace: app.birthPlace || '',
            birthDate: app.birthDate || '',
            gender: app.gender || 'Laki-laki',
            religion: app.religion || 'Islam',
            phone: app.phone || storedAccount.whatsapp || '',
            email: app.email || storedAccount.email || '',
            address: app.address || '',
            schoolName: app.schoolName || '',
            npsn: app.npsn || '',
            nisn: app.nisn || '',
            graduationYear: app.graduationYear || '2026',
            major: app.major || 'IPA',
            parentName: app.parentName || '',
            parentPhone: app.parentPhone || '',
            parentJob: app.parentJob || '',
            parentIncome: app.parentIncome || 'Rp3.000.000 - Rp5.000.000',
            fileKtp: app.fileKtp || '',
            fileKk: app.fileKk || '',
            fileIjazah: app.fileIjazah || '',
            fileFoto: app.fileFoto || '',
            fileTambahan: app.fileTambahan || '',
            statementAgreed: true,
          }));

          // Set jenjang berdasarkan degreeLevel prodi langsung dari database
          if (app.studyProgram?.degreeLevel) {
            setSelectedJenjang(app.studyProgram.degreeLevel);
          }
        } else {
          // Initialize with account defaults
          setFormData((prev) => ({
            ...prev,
            fullName: storedAccount.fullName || '',
            email: storedAccount.email || '',
            phone: storedAccount.whatsapp || storedAccount.phone || '',
          }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching PMB dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Persist addressState ke localStorage agar tidak hilang saat reload setelah simpan draf
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const accountRaw = localStorage.getItem('pmb_account_session') || localStorage.getItem('pmb_applicant_session');
    if (!accountRaw) return;
    try {
      const acc = JSON.parse(accountRaw);
      const key = `pmb_address_state_${acc.id || acc.email}`;
      localStorage.setItem(key, JSON.stringify(addressState));
    } catch {}
  }, [addressState]);


  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      const accountRaw = localStorage.getItem('pmb_account_session') || localStorage.getItem('pmb_applicant_session');
      if (accountRaw) {
        try {
          const acc = JSON.parse(accountRaw);
          localStorage.removeItem(`pmb_address_state_${acc.id || acc.email}`);
        } catch {}
      }
      localStorage.removeItem('pmb_account_session');
      localStorage.removeItem('pmb_account_token');
      localStorage.removeItem('pmb_applicant_session');
      localStorage.removeItem('pmb_applicant_token');
    }
    router.push('/pmb/login');
  };


  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Gelombang aktif otomatis sesuai jenjang yang dipilih
  const activeWave = useMemo(() => {
    if (!selectedJenjang) return null; // belum ada jenjang dipilih
    const matchingWaves = options.waves.filter((w) => (w.jenjang || 'S1') === selectedJenjang);
    return matchingWaves.find((w: any) => w.isActive) || matchingWaves.find((w: any) => w.isDefault) || matchingWaves[0] || null;
  }, [options.waves, selectedJenjang]);

  // Otomatis sinkronkan waveId ke gelombang aktif (hanya jika jenjang sudah dipilih)
  useEffect(() => {
    if (!selectedJenjang) return;
    if (activeWave && (!formData.waveId || !options.waves.some((w) => w.id === formData.waveId && (w.jenjang || 'S1') === selectedJenjang))) {
      setFormData((prev) => ({ ...prev, waveId: activeWave.id }));
    }
  }, [activeWave, selectedJenjang, options.waves, formData.waveId]);

  // 1. Fetch Provinces from Emsifa API Wilayah
  useEffect(() => {
    async function loadProvinces() {
      setLoadingProvinces(true);
      try {
        const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setProvinces(data);
        }
      } catch (err) {
        console.warn('Gagal memuat provinsi dari API wilayah:', err);
      } finally {
        setLoadingProvinces(false);
      }
    }
    loadProvinces();
  }, []);

  // 2. Fetch Regencies / Kota-Kabupaten when provinceId changes
  useEffect(() => {
    if (!addressState.provinceId) {
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      return;
    }

    async function loadRegencies() {
      setLoadingRegencies(true);
      try {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${addressState.provinceId}.json`
        );
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setRegencies(data);
        }
      } catch (err) {
        console.warn('Gagal memuat kabupaten/kota:', err);
      } finally {
        setLoadingRegencies(false);
      }
    }
    loadRegencies();
  }, [addressState.provinceId]);

  // 3. Fetch Districts / Kecamatan when regencyId changes
  useEffect(() => {
    if (!addressState.regencyId) {
      setDistricts([]);
      setVillages([]);
      return;
    }

    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${addressState.regencyId}.json`
        );
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setDistricts(data);
        }
      } catch (err) {
        console.warn('Gagal memuat kecamatan:', err);
      } finally {
        setLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, [addressState.regencyId]);

  // 4. Fetch Villages / Kelurahan when districtId changes
  useEffect(() => {
    setIsManualVillage(false);
    if (!addressState.districtId) {
      setVillages([]);
      return;
    }

    async function loadVillages() {
      setLoadingVillages(true);
      try {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${addressState.districtId}.json`
        );
        if (res.ok) {
          let data: RegionItem[] = await res.json();
          // Patch Desa Bener di Kec. Majenang (Cilacap - ID 3301030) jika terlewat dari data API publik
          if (addressState.districtId === '3301030' || addressState.districtName?.toUpperCase().includes('MAJENANG')) {
            if (!data.some((v) => v.name?.toUpperCase() === 'BENER')) {
              data.push({
                id: '3301030012',
                district_id: addressState.districtId,
                name: 'BENER',
              });
              data.sort((a, b) => a.name.localeCompare(b.name));
            }
          }
          setVillages(data);
        }
      } catch (err) {
        console.warn('Gagal memuat kelurahan:', err);
      } finally {
        setLoadingVillages(false);
      }
    }
    loadVillages();
  }, [addressState.districtId, addressState.districtName]);

  // 5. Automatically compose standardized full address into formData.address
  useEffect(() => {
    const parts: string[] = [];
    if (addressState.streetAddress.trim()) parts.push(toTitleCase(addressState.streetAddress.trim()));
    if (addressState.rtRw.trim()) parts.push(`RT/RW: ${addressState.rtRw.trim().toUpperCase()}`);
    if (addressState.villageName) parts.push(`Kel./Desa ${toTitleCase(addressState.villageName)}`);
    if (addressState.districtName) parts.push(`Kec. ${toTitleCase(addressState.districtName)}`);
    if (addressState.regencyName) parts.push(toTitleCase(addressState.regencyName));
    if (addressState.provinceName) parts.push(`Prov. ${toTitleCase(addressState.provinceName)}`);
    if (addressState.postalCode.trim()) parts.push(`Kode Pos ${addressState.postalCode.trim()}`);
    if (addressState.country && addressState.country.trim() !== 'Indonesia') parts.push(toTitleCase(addressState.country.trim()));

    if (parts.length > 0) {
      setFormData((prev) => ({ ...prev, address: parts.join(', ') }));
    }
  }, [addressState]);

  // Jenjang yang tersedia diambil dari unique degreeLevel prodi di database
  // Hanya tampilkan yang ada entry-nya di DEGREE_LEVEL_INFO (tidak ada fallback hardcode)
  const availableJenjang = useMemo(() => {
    const ORDER = ['S1', 'D4', 'D3', 'S2', 'S3'];
    const fromDB = Array.from(new Set(options.studyPrograms.map((p) => p.degreeLevel).filter(Boolean)));
    // Hanya masukkan degreeLevel yang dikenal (ada di DEGREE_LEVEL_INFO)
    const known = fromDB.filter((dl) => dl in DEGREE_LEVEL_INFO);
    return known.sort((a, b) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [options.studyPrograms]);

  // Filter prodi sesuai jenjang yang dipilih — langsung match degreeLevel dari DB
  const filteredStudyPrograms = useMemo(() => {
    if (!selectedJenjang) return [];
    return options.studyPrograms.filter((p) => p.degreeLevel === selectedJenjang);
  }, [options.studyPrograms, selectedJenjang]);

  // Handler pergantian jenjang kuliah
  const handleSelectJenjang = (j: string) => {
    setSelectedJenjang(j);

    // Ambil gelombang aktif untuk jenjang baru
    const matchingWaves = options.waves.filter((w) => (w.jenjang || 'S1') === j);
    const active = matchingWaves.find((w: any) => w.isActive) || matchingWaves.find((w: any) => w.isDefault) || matchingWaves[0];
    const nextWaveId = active?.id || '';

    // Ambil prodi yang cocok dengan jenjang baru — langsung filter degreeLevel
    const matchingProdis = options.studyPrograms.filter((p) => p.degreeLevel === j);
    const curProdiValid = matchingProdis.some((p) => p.id === formData.studyProgramId);
    const nextProdiId = curProdiValid ? formData.studyProgramId : '';

    const info = getDegreeInfo(j);
    setFormData((prev) => ({
      ...prev,
      waveId: nextWaveId,
      studyProgramId: nextProdiId,
      isKip: info?.kipEligible ? prev.isKip : false,
      trackId: prev.trackId || (options.tracks[0]?.id || ''),
      classId: prev.classId || (options.classes[0]?.id || ''),
    }));
  };

  // Step Validation
  const handleNextStep = () => {
    setWizardError(null);
    if (currentStep === 1) {
      const effectiveWaveId = formData.waveId || activeWave?.id;
      // Cek apakah gelombang ada
      if (!effectiveWaveId || !activeWave) {
        setWizardError(`Belum ada gelombang pendaftaran aktif untuk jenjang ${selectedJenjang}. Silakan hubungi panitia PMB.`);
        return;
      }
      // Cek apakah gelombang sudah dibuka (isActive harus true)
      if (!(activeWave as any).isActive) {
        setWizardError(`Gelombang "${activeWave.name}" untuk jenjang ${selectedJenjang} belum dibuka. Pendaftaran hanya dapat dilakukan pada periode yang telah ditentukan.`);
        return;
      }
      if (getDegreeInfo(selectedJenjang).showTrackClass && !formData.trackId) {
        setWizardError('Silakan pilih salah satu Jalur Mahasiswa.');
        return;
      }
      if (!formData.studyProgramId) {
        setWizardError('Silakan pilih Program Studi yang Anda minati.');
        return;
      }
      // Pastikan waveId, trackId dan classId terisi
      setFormData((prev) => ({
        ...prev,
        waveId: effectiveWaveId,
        trackId: prev.trackId || (options.tracks[0]?.id || ''),
        classId: prev.classId || (options.classes[0]?.id || ''),
      }));
    } else if (currentStep === 2) {
      if (!formData.fullName.trim()) {
        setWizardError('Nama Lengkap wajib diisi.');
        return;
      }
      if (!formData.nik.trim()) {
        setWizardError('Nomor Induk Kependudukan (NIK) 16 digit wajib diisi.');
        return;
      }
      if (!formData.phone.trim()) {
        setWizardError('Nomor WhatsApp aktif wajib diisi.');
        return;
      }
      if (!addressState.provinceName && !formData.address.trim()) {
        setWizardError('Silakan pilih Provinsi tempat tinggal Anda.');
        return;
      }
      if (!addressState.regencyName && !formData.address.trim()) {
        setWizardError('Silakan pilih Kota / Kabupaten tempat tinggal Anda.');
        return;
      }
      if (!addressState.streetAddress.trim() && !formData.address.trim()) {
        setWizardError('Alamat Jalan / No. Rumah domisili wajib diisi.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        fullName: toTitleCase(prev.fullName),
        birthPlace: toTitleCase(prev.birthPlace),
      }));
      setAddressState((prev) => ({
        ...prev,
        streetAddress: toTitleCase(prev.streetAddress),
        villageName: toTitleCase(prev.villageName),
      }));
    } else if (currentStep === 3) {
      if (!formData.schoolName.trim()) {
        setWizardError('Nama Asal Sekolah / Kampus wajib diisi.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        schoolName: toTitleCase(prev.schoolName),
        major: prev.major ? toTitleCase(prev.major) : prev.major,
      }));
    } else if (currentStep === 4) {
      if (!formData.parentName.trim()) {
        setWizardError('Nama Orang Tua / Wali wajib diisi.');
        return;
      }
      if (!formData.parentPhone.trim()) {
        setWizardError('Nomor WhatsApp Orang Tua / Wali wajib diisi.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        parentName: toTitleCase(prev.parentName),
        parentJob: toTitleCase(prev.parentJob),
      }));
    }

    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setWizardError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Helper sanitasi kapitalisasi huruf pertama otomatis (Title Case)
  const sanitizeFormTitleCase = (data: typeof formData) => ({
    ...data,
    fullName: toTitleCase(data.fullName),
    birthPlace: toTitleCase(data.birthPlace),
    address: toTitleCase(data.address),
    schoolName: toTitleCase(data.schoolName),
    major: data.major ? toTitleCase(data.major) : data.major,
    parentName: toTitleCase(data.parentName),
    parentJob: toTitleCase(data.parentJob),
  });

  const handleSchoolNameChange = (val: string) => {
    setFormData((p) => ({ ...p, schoolName: val }));
    setShowSchoolDropdown(true);

    if (schoolSearchDebounce.current) {
      clearTimeout(schoolSearchDebounce.current);
    }

    if (val.trim().length >= 3) {
      setIsSearchingSchool(true);
      schoolSearchDebounce.current = setTimeout(async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/admissions/pmb/schools?search=${encodeURIComponent(val.trim())}`);
          if (res.ok) {
            const json = await res.json();
            const list = json.data !== undefined ? json.data : json;
            if (Array.isArray(list)) {
              setSchoolSuggestions(list);
            }
          }
        } catch (err) {
          console.warn('Gagal mencari sekolah:', err);
        } finally {
          setIsSearchingSchool(false);
        }
      }, 350);
    } else {
      setSchoolSuggestions([]);
      setIsSearchingSchool(false);
    }
  };

  const handleSelectSchool = (item: SchoolSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      schoolName: toTitleCase(item.name || item.rawName || ''),
      npsn: item.npsn || prev.npsn,
    }));
    setShowSchoolDropdown(false);
  };

  // 1. Simpan Draf Formulir
  const handleSaveDraft = async () => {
    if (!account) return;
    setIsSaving(true);
    setWizardError(null);
    setSuccessNotice(null);

    const sanitized = sanitizeFormTitleCase(formData);
    setFormData(sanitized);

    try {
      const { statementAgreed, ...draftFields } = sanitized;
      const payload = {
        ...draftFields,
        accountId: account.id,
        email: sanitized.email || account?.email || '',
        isKip: getDegreeInfo(selectedJenjang).kipEligible ? sanitized.isKip : false,
        trackId: sanitized.trackId || (options.tracks[0]?.id || ''),
        classId: sanitized.classId || (options.classes[0]?.id || ''),
      };

      const accountQuery = encodeURIComponent(account.id || account.email || '');
      const res = await fetch(`${apiBaseUrl}/admissions/pmb/draft?accountId=${accountQuery}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || (!json?.success && !json?.data?.success)) {
        throw new Error(json?.message || 'Gagal menyimpan draf pendaftaran.');
      }

      const resData = json.data !== undefined ? json.data : json;
      if (resData?.account) {
        setAccount(resData.account);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pmb_account_session', JSON.stringify(resData.account));
        }
      }
      if (resData?.application) {
        setApplication(resData.application);
      }

      setSuccessNotice('Draf formulir pendaftaran berhasil disimpan! Anda dapat melanjutkannya sewaktu-waktu.');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setWizardError(err.message || 'Terjadi gangguan saat menyimpan draf.');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Submit & Finalisasi Formulir Pendaftaran
  const handleSubmitApplication = async () => {
    if (!formData.statementAgreed) {
      setWizardError('Harap centang persetujuan kebenaran berkas pendaftaran.');
      return;
    }

    if (!account) return;
    setIsSaving(true);
    setWizardError(null);

    const sanitized = sanitizeFormTitleCase(formData);
    setFormData(sanitized);

    try {
      const { statementAgreed, ...submitFields } = sanitized;
      const payload = {
        ...submitFields,
        accountId: account.id,
        statementAgreed: true,
        email: sanitized.email || account?.email || '',
        isKip: getDegreeInfo(selectedJenjang).kipEligible ? sanitized.isKip : false,
        trackId: sanitized.trackId || (options.tracks[0]?.id || ''),
        classId: sanitized.classId || (options.classes[0]?.id || ''),
      };

      const accountQuery = encodeURIComponent(account.id || account.email || '');
      const res = await fetch(`${apiBaseUrl}/admissions/pmb/submit?accountId=${accountQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || (!json?.success && !json?.data?.success)) {
        throw new Error(json?.message || 'Gagal mengirim pendaftaran.');
      }

      const resData = json.data !== undefined ? json.data : json;
      if (resData?.account) {
        setAccount(resData.account);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pmb_account_session', JSON.stringify(resData.account));
        }
      }
      setApplication(resData.application || resData);
      setIsEditingSubmitted(false);
      setSuccessNotice('Pendaftaran berhasil dikirim! Silakan selesaikan pembayaran biaya registrasi.');
    } catch (err: any) {
      setWizardError(err.message || 'Terjadi kesalahan saat finalisasi formulir.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Konfirmasi Upload Bukti Pembayaran
  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    setIsUploadingPayment(true);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/pmb/payments/${selectedPayment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          proofUrl: proofUrl || 'bukti-transfer-valid.png',
          notes: 'Konfirmasi bukti transfer dari portal pendaftar',
        }),
      });

      const json = await res.json();
      if (!res.ok || (!json?.success && !json?.data?.success)) {
        throw new Error(json?.message || 'Gagal mengunggah bukti bayar.');
      }

      setSelectedPayment(null);
      setProofUrl('');
      // Refresh dashboard data
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setIsUploadingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-700">
        <div className="flex items-center gap-3 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="w-5 h-5 rounded-full border-2 border-[#1E3A8A] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-800">Memuat Portal Pendaftar PMB...</span>
        </div>
      </div>
    );
  }

  // Cek apakah pendaftaran sudah di-submit
  const isSubmitted = application?.formStatus === 'SUBMITTED' && !isEditingSubmitted;

  // Payments lookup
  const regPayment = application?.payments?.find((p) => p.type === 'REGISTRATION');
  const reRegPayment = application?.payments?.find((p) => p.type === 'RE_REGISTRATION');

  const isRegistrationPaid = regPayment?.status === 'PAID';
  const isReRegistrationPaid = reRegPayment?.status === 'PAID';
  const isPassed = application?.selectionStatus === 'PASSED';
  const isConvertedStudent = Boolean(application?.studentId && application?.nim);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Header Resmi Kampus */}
      <header className="bg-[#1E3A8A] text-white border-b-2 border-[#D4A017] shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/pmb"
              className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-900 text-blue-200 hover:text-white transition-colors"
              title="Kembali ke Beranda PMB"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border-2 border-[#D4A017] flex items-center justify-center font-extrabold text-[#1E3A8A] text-xs shadow-xs">
                ITN
              </div>
              <div>
                <span className="font-bold text-sm tracking-wide block leading-tight">
                  INSTITUT TEKNOLOGI NUSANTARA
                </span>
                <span className="text-[11px] text-blue-200 block">
                  Dashboard Calon Mahasiswa Baru 2027
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block">{account?.fullName || 'Calon Mahasiswa'}</span>
              <span className="text-[11px] text-amber-300 font-mono font-semibold">
                {application?.registrationNumber || 'Draf Pendaftaran'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-red-600 hover:text-white border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success Alert Notice */}
        {successNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="flex-1">{successNotice}</span>
          </div>
        )}

        {/* Wizard Error Notice */}
        {wizardError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-xs font-semibold shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="flex-1">{wizardError}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAMPILAN 1: JIKA SUDAH DISUBMIT (DASHBOARD PROGRESS PMB)          */}
        {/* ================================================================= */}
        {isSubmitted ? (
          <div className="space-y-6">
            {/* Status Hero Card */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                      {application.wave?.name || 'Gelombang 1'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                      {application.track?.name || 'Jalur Reguler'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200">
                      {application.admissionClass?.name || 'Kelas Reguler'}
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900">
                    Pendaftaran: {application.fullName}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nomor Pendaftaran: <span className="font-mono font-bold text-[#1E3A8A]">{application.registrationNumber}</span> | Program Studi:{' '}
                    <span className="font-bold text-slate-800">{application.studyProgram?.name || '-'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Bukti</span>
                  </button>
                  <button
                    onClick={() => setIsEditingSubmitted(true)}
                    className="px-3.5 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Perbarui Berkas</span>
                  </button>
                </div>
              </div>

              {/* Progress Stepper Tracking PMB */}
              <div className="pt-6">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">
                  Tahapan Seleksi & Registrasi PMB
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Step 1: Formulir Terkirim */}
                  <div className="p-3.5 rounded-xl border bg-emerald-50/70 border-emerald-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-emerald-800">1. Formulir</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs font-extrabold text-emerald-900 block">Terkirim</span>
                    <span className="text-[10px] text-emerald-700 font-mono mt-0.5">{application.registrationNumber}</span>
                  </div>

                  {/* Step 2: Pembayaran Registrasi */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isRegistrationPaid
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : regPayment?.status === 'VERIFYING'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-red-50/70 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700">2. Biaya Registrasi</span>
                      {isRegistrationPaid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold block ${
                        isRegistrationPaid ? 'text-emerald-900' : regPayment?.status === 'VERIFYING' ? 'text-amber-800' : 'text-red-800'
                      }`}
                    >
                      {isRegistrationPaid ? 'Lunas' : regPayment?.status === 'VERIFYING' ? 'Menunggu Verifikasi' : 'Menunggu Pembayaran'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Rp{(regPayment?.amount || 250000).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Step 3: Verifikasi Berkas */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      application.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : application.verificationStatus === 'REJECTED'
                        ? 'bg-red-50/70 border-red-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700">3. Berkas Dokumen</span>
                      {application.verificationStatus === 'VERIFIED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : application.verificationStatus === 'REJECTED' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold block ${
                        application.verificationStatus === 'VERIFIED'
                          ? 'text-emerald-900'
                          : application.verificationStatus === 'REJECTED'
                          ? 'text-red-800'
                          : 'text-slate-700'
                      }`}
                    >
                      {application.verificationStatus === 'VERIFIED'
                        ? 'Terverifikasi'
                        : application.verificationStatus === 'REJECTED'
                        ? 'Ditolak / Perbaikan'
                        : 'Menunggu Verifikasi'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {application.verificationStatus === 'VERIFIED' ? 'Berkas Valid' : 'Panitia PMB'}
                    </span>
                  </div>

                  {/* Step 4: Hasil Seleksi */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isPassed
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : application.selectionStatus === 'FAILED'
                        ? 'bg-red-50/70 border-red-200'
                        : application.selectionStatus === 'RESERVE'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700">4. Seleksi & Kelulusan</span>
                      {isPassed ? (
                        <Award className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold block ${
                        isPassed
                          ? 'text-emerald-900'
                          : application.selectionStatus === 'FAILED'
                          ? 'text-red-800'
                          : application.selectionStatus === 'RESERVE'
                          ? 'text-amber-800'
                          : 'text-slate-700'
                      }`}
                    >
                      {isPassed
                        ? 'Dinyatakan LULUS'
                        : application.selectionStatus === 'FAILED'
                        ? 'Tidak Lulus'
                        : application.selectionStatus === 'RESERVE'
                        ? 'Cadangan'
                        : 'Proses Seleksi'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {application.testScore ? `Skor: ${application.testScore}` : 'Rapat Yudisium'}
                    </span>
                  </div>

                  {/* Step 5: Daftar Ulang & NIM */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isConvertedStudent
                        ? 'bg-blue-50/70 border-blue-200'
                        : isReRegistrationPaid
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700">5. Mahasiswa Resmi</span>
                      {isConvertedStudent ? (
                        <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold block ${
                        isConvertedStudent ? 'text-[#1E3A8A]' : isReRegistrationPaid ? 'text-emerald-800' : 'text-slate-600'
                      }`}
                    >
                      {isConvertedStudent ? 'NIM Resmi Terbit' : isReRegistrationPaid ? 'Daftar Ulang Lunas' : 'Menunggu Pelunasan'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {application.nim || 'Pasca Kelulusan'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BANNER 1: Mahasiswa Resmi (Dikonversi) */}
            {isConvertedStudent && (
              <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md border-2 border-[#D4A017] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>RESMI MENJADI MAHASISWA BARU ITN</span>
                  </div>
                  <h2 className="text-xl font-black tracking-wide text-white">
                    Selamat Bergabung di Institut Teknologi Nusantara!
                  </h2>
                  <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
                    Data pendaftaran Anda telah berhasil dikonversi. Anda kini resmi terdaftar sebagai mahasiswa aktif. Gunakan NIM dan kredensial portal akademik Anda di bawah ini untuk mengakses sistem perkuliahan dan KRS.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                      <span className="text-[10px] text-blue-200 block uppercase font-bold">Nomor Induk Mahasiswa (NIM)</span>
                      <span className="text-lg font-mono font-black text-amber-300 tracking-wider">{application.nim}</span>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                      <span className="text-[10px] text-blue-200 block uppercase font-bold">Program Studi</span>
                      <span className="text-sm font-bold text-white">{application.studyProgram?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href="/login"
                    className="px-5 py-3 rounded-xl bg-[#D4A017] hover:bg-amber-500 text-blue-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <span>Masuk ke Portal Akademik</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* ACTION BANNER 2: Tagihan Biaya Registrasi (Belum Lunas) */}
            {!isRegistrationPaid && regPayment && (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Tagihan Biaya Registrasi: Rp{regPayment.amount.toLocaleString('id-ID')}
                    </span>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Silakan lakukan pembayaran biaya registrasi awal ke Virtual Account BNI ITN:{' '}
                      <span className="font-mono font-bold text-slate-900">8802 0812 7643 8553</span> a.n. ITN Penerimaan Mahasiswa Baru.
                    </p>
                    {regPayment.status === 'VERIFYING' && (
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                        Bukti bayar telah dikirim, menunggu verifikasi bagian keuangan.
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPayment(regPayment)}
                  className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{regPayment.status === 'VERIFYING' ? 'Ganti Bukti Bayar' : 'Konfirmasi Pembayaran'}</span>
                </button>
              </div>
            )}

            {/* ACTION BANNER 3: Berkas Ditolak */}
            {application.verificationStatus === 'REJECTED' && (
              <div className="p-5 bg-red-50 border border-red-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-red-900 block">
                      Berkas Pendaftaran Memerlukan Perbaikan
                    </span>
                    <p className="text-xs text-red-700 mt-0.5">
                      Catatan Verifikator: {application.verificationNote || 'Harap periksa kembali berkas dokumen Anda.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingSubmitted(true)}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Perbaiki Dokumen Sekarang</span>
                </button>
              </div>
            )}

            {/* ACTION BANNER 4: Lulus Seleksi & Tagihan Daftar Ulang */}
            {isPassed && reRegPayment && !isReRegistrationPaid && (
              <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block uppercase tracking-wide">
                      Tahap Akhir: Pembayaran Biaya Daftar Ulang
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Total Biaya Daftar Ulang: Rp{reRegPayment.amount.toLocaleString('id-ID')}
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 max-w-xl">
                      Selamat atas kelulusan Anda! Segera selesaikan pelunasan daftar ulang untuk penerbitan Nomor Induk Mahasiswa (NIM) resmi dan pembuatan akun portal akademik Anda.
                    </p>
                    {reRegPayment.status === 'VERIFYING' && (
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                        Bukti bayar daftar ulang sedang diverifikasi oleh staf keuangan.
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPayment(reRegPayment)}
                  className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-md cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{reRegPayment.status === 'VERIFYING' ? 'Ganti Bukti Daftar Ulang' : 'Bayar Daftar Ulang'}</span>
                </button>
              </div>
            )}

            {/* Detail Ringkasan Formulir Terdaftar */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1E3A8A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Rincian Data Formulir Calon Mahasiswa
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Tersimpan di Database PostgreSQL
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Data Kependudukan & Kontak</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">NIK:</span>
                    <span className="col-span-2 font-mono font-semibold text-slate-800">{application.nik || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Lengkap:</span>
                    <span className="col-span-2 font-bold text-slate-900">{application.fullName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Tempat, Tgl Lahir:</span>
                    <span className="col-span-2 text-slate-800">
                      {application.birthPlace || '-'}, {application.birthDate || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Jenis Kelamin:</span>
                    <span className="col-span-2 text-slate-800">{application.gender || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Alamat Lengkap:</span>
                    <span className="col-span-2 text-slate-800 leading-relaxed">{application.address || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">WhatsApp:</span>
                    <span className="col-span-2 text-slate-800">{application.phone}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Email:</span>
                    <span className="col-span-2 text-slate-800">{application.email}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pendidikan & Orang Tua</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Asal Sekolah:</span>
                    <span className="col-span-2 font-bold text-slate-900">{application.schoolName || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">NPSN / Jurusan:</span>
                    <span className="col-span-2 text-slate-800">
                      {application.npsn || '-'} / {application.major || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">NISN:</span>
                    <span className="col-span-2 font-mono font-semibold text-slate-800">{(application as any).nisn || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Tahun Lulus:</span>
                    <span className="col-span-2 text-slate-800">{application.graduationYear || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Orang Tua:</span>
                    <span className="col-span-2 text-slate-800">{application.parentName || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Kontak Ortu:</span>
                    <span className="col-span-2 text-slate-800">{application.parentPhone || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Pekerjaan / Gaji:</span>
                    <span className="col-span-2 text-slate-800">
                      {application.parentJob || '-'} ({application.parentIncome || '-'})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">KIP-Kuliah:</span>
                    <span className="col-span-2 font-semibold text-slate-800">
                      {application.isKip ? 'Ya (Mengajukan KIP-K)' : 'Tidak (Reguler Mandiri)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* TAMPILAN 2: FORMULIR PENDAFTARAN WIZARD (DRAFT & SUBMIT)           */
          /* ================================================================= */
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Header Form */}
            <div className="bg-[#1E3A8A] text-white p-6 sm:p-8 border-b border-blue-950">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-200 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                    <span>FORMULIR PENDAFTARAN MAHASISWA BARU</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Lengkapi Data Pendaftaran Anda
                  </h1>
                  <p className="text-xs text-blue-200 mt-1">
                    Calon Mahasiswa: <strong className="text-white">{account?.fullName}</strong> ({account?.email})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Draf'}</span>
                  </button>
                  {application?.formStatus === 'SUBMITTED' && (
                    <button
                      onClick={() => setIsEditingSubmitted(false)}
                      className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Step Progress Bar */}
              <div className="grid grid-cols-5 gap-2 mt-8">
                {[
                  { step: 1, title: 'Pilihan', desc: 'Jenjang & Prodi' },
                  { step: 2, title: 'Data Diri', desc: 'NIK & Biodata' },
                  { step: 3, title: 'Sekolah', desc: 'Asal Sekolah' },
                  { step: 4, title: 'Orang Tua', desc: 'Kontak Wali' },
                  { step: 5, title: 'Finalisasi', desc: 'Kirim Berkas' },
                  ].map((item) => (
                  <button
                    key={item.step}
                    onClick={() => {
                      // Hanya boleh navigate ke step yang sudah pernah dicapai (backward navigation)
                      // Maju hanya bisa lewat tombol Lanjutkan agar validasi berjalan
                      if (item.step < currentStep) {
                        setWizardError(null);
                        setCurrentStep(item.step);
                      }
                    }}
                    disabled={item.step > currentStep}
                    className={`text-left p-2.5 rounded-lg transition-all border ${
                      currentStep === item.step
                        ? 'bg-white text-[#1E3A8A] border-white shadow-xs'
                        : item.step < currentStep
                        ? 'bg-blue-900/60 text-emerald-300 border-blue-800 cursor-pointer hover:bg-blue-800/80'
                        : 'bg-blue-900/30 text-blue-300/50 border-transparent cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-black">0{item.step}</span>
                      {item.step < currentStep && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      {item.step > currentStep && <span className="text-[9px] opacity-70">🔒</span>}
                    </div>
                    <span className="text-[11px] font-bold block truncate">{item.title}</span>
                    <span className="text-[9px] opacity-80 block truncate hidden md:block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-8">
              {/* STEP 1: PILIHAN PENDAFTARAN */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* 1. PILIH JENJANG PENDIDIKAN DULU */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          1. Pilih Jenjang Pendidikan
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Pilih jenjang studi yang ingin Anda tempuh untuk menyesuaikan formulir pendaftaran
                        </span>
                      </div>
                      {selectedJenjang && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200">
                          Jenjang Terpilih: {selectedJenjang}
                        </span>
                      )}
                    </div>

                    <div className={`grid grid-cols-1 gap-3 ${
                        availableJenjang.length <= 2 ? 'md:grid-cols-2' :
                        availableJenjang.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'
                      }`}>
                      {availableJenjang.map((jenjang) => {
                        const info = getDegreeInfo(jenjang);
                        // Skip jika degreeLevel tidak dikenal di DEGREE_LEVEL_INFO
                        if (!info) return null;
                        const isSelected = selectedJenjang === jenjang;
                        return (
                          <button
                            key={jenjang}
                            type="button"
                            onClick={() => handleSelectJenjang(jenjang)}
                            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#1E3A8A] bg-blue-50/60 shadow-xs ring-1 ring-[#1E3A8A]/30'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-black ${isSelected ? 'text-[#1E3A8A]' : 'text-slate-900'}`}>
                                  {info.title}
                                </span>
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white' : 'border-slate-300'
                                }`}>
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                                {info.subtitle}
                              </span>
                              <p className="text-[11px] text-slate-600 leading-relaxed">{info.desc}</p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400">Jenjang {jenjang}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {info.badge}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* GELOMBANG PENDAFTARAN AKTIF (OTOMATIS) — hanya tampil jika jenjang sudah dipilih */}
                  {selectedJenjang && <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Gelombang Pendaftaran Aktif ({selectedJenjang})
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Otomatis diterapkan oleh sistem sesuai jenjang yang Anda pilih
                      </span>
                    </div>

                    {activeWave ? (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                            <Calendar className="w-5 h-5 text-blue-200" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900">{activeWave.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Gelombang Aktif
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Periode Pendaftaran: <strong className="text-slate-800">{activeWave.startDate}</strong> s.d.{' '}
                              <strong className="text-slate-800">{activeWave.endDate}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-blue-200/60 shrink-0 text-xs">
                          <div className="bg-white px-3.5 py-2 rounded-xl border border-blue-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Biaya Registrasi</span>
                            <span className="font-extrabold text-sm text-[#1E3A8A]">
                              Rp{(activeWave.registrationFee ?? 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Biaya Daftar Ulang</span>
                            <span className="font-extrabold text-sm text-emerald-700">
                              Rp{(activeWave.reRegistrationFee ?? 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 text-amber-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Belum ada gelombang pendaftaran aktif untuk jenjang {selectedJenjang}. Silakan hubungi admin PMB.</span>
                      </div>
                    )}
                  </div>}

                  {/* 3. CONDITIONAL FIELDS: JENIS PENDAFTARAN, JENIS MAHASISWA & KELAS KULIAH */}
                  {/* Ditampilkan hanya untuk jenjang dengan showTrackClass: true di DEGREE_LEVEL_INFO */}
                  {getDegreeInfo(selectedJenjang)?.showTrackClass ? (
                    <>
                      {/* Jenis Pendaftaran & Jenis Mahasiswa */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 3a. JENIS PENDAFTARAN */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Jenis Pendaftaran
                          </label>
                          <div className="space-y-2">
                            {options.registrationTypes && options.registrationTypes.length > 0 ? (
                              options.registrationTypes.map((rt) => {
                                const isSelected =
                                  formData.registrationTypeId === rt.id ||
                                  (!formData.registrationTypeId && (rt.isKip ? formData.isKip : !formData.isKip));

                                return (
                                  <label
                                    key={rt.id}
                                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                      isSelected
                                        ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs ring-1 ring-[#1E3A8A]/30'
                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="radio"
                                        name="jenisPendaftaran"
                                        value={rt.id}
                                        checked={isSelected}
                                        onChange={() =>
                                          setFormData((p) => ({
                                            ...p,
                                            registrationTypeId: rt.id,
                                            isKip: rt.isKip,
                                          }))
                                        }
                                        className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                      />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-slate-900 block">{rt.name}</span>
                                          {rt.badge && (
                                            <span
                                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                rt.isKip
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : 'bg-blue-100 text-[#1E3A8A]'
                                              }`}
                                            >
                                              {rt.badge}
                                            </span>
                                          )}
                                        </div>
                                        {rt.description && (
                                          <span className="text-[11px] text-slate-500 block mt-0.5">
                                            {rt.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })
                            ) : (
                              <>
                                <label
                                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    !formData.isKip
                                      ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs'
                                      : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name="jenisPendaftaran"
                                      checked={!formData.isKip}
                                      onChange={() => setFormData((p) => ({ ...p, isKip: false }))}
                                      className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                    />
                                    <div>
                                      <span className="text-xs font-bold text-slate-900 block">NON-KIP (Reguler Mandiri)</span>
                                      <span className="text-[11px] text-slate-500 block">Pendaftaran umum dengan pembiayaan mandiri</span>
                                    </div>
                                  </div>
                                </label>

                                <label
                                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    formData.isKip
                                      ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs'
                                      : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name="jenisPendaftaran"
                                      checked={formData.isKip}
                                      onChange={() => setFormData((p) => ({ ...p, isKip: true }))}
                                      className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-900 block">KIP-Kuliah (Beasiswa)</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Beasiswa Penuh</span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">Bagi pemegang nomor KIP / kartu bantuan pendidikan</span>
                                    </div>
                                  </div>
                                </label>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 3b. JENIS MAHASISWA: REGULER vs TRANSFER */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Jenis Mahasiswa
                          </label>
                          <div className="space-y-2">
                            {options.tracks.map((t) => (
                              <label
                                key={t.id}
                                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                  formData.trackId === t.id
                                    ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name="trackId"
                                    value={t.id}
                                    checked={formData.trackId === t.id}
                                    onChange={(e) => setFormData((p) => ({ ...p, trackId: e.target.value }))}
                                    className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 block">{t.name}</span>
                                    {t.description && <span className="text-[11px] text-slate-500 block">{t.description}</span>}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3c. PILIHAN KELAS KULIAH */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Pilihan Kelas Kuliah
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {options.classes.map((c) => (
                            <label
                              key={c.id}
                              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                formData.classId === c.id
                                  ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="classId"
                                  value={c.id}
                                  checked={formData.classId === c.id}
                                  onChange={(e) => setFormData((p) => ({ ...p, classId: e.target.value }))}
                                  className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                />
                                <div>
                                  <span className="text-xs font-bold text-slate-900 block">{c.name}</span>
                                  {c.description && <span className="text-[11px] text-slate-500 block">{c.description}</span>}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* NOTIFIKASI KHUSUS S2 / S3: Tidak ada KIP, jenis mahasiswa & kelas */
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1E3A8A] flex items-center justify-center shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">
                          Jalur Masuk Reguler Pascasarjana ({selectedJenjang})
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Pendaftaran program {selectedJenjang === 'S2' ? 'Magister (S2)' : 'Doktoral (S3)'} diproses secara reguler akademik mandiri tanpa seleksi beasiswa KIP-Kuliah dan tanpa pembagian kelas kuliah. Anda dapat langsung memilih Program Studi tujuan Anda di bawah.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4. PROGRAM STUDI DARI MASTER AKADEMIK */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          3. Pilih Program Studi ({selectedJenjang})
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Data disinkronkan langsung dari Master Data Akademik Kampus ({filteredStudyPrograms.length} program studi tersedia)
                        </span>
                      </div>
                    </div>

                    {filteredStudyPrograms.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredStudyPrograms.map((p) => (
                          <label
                            key={p.id}
                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer block ${
                              formData.studyProgramId === p.id
                                ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="studyProgramId"
                              value={p.id}
                              checked={formData.studyProgramId === p.id}
                              onChange={(e) => setFormData((prev) => ({ ...prev, studyProgramId: e.target.value }))}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-xs text-slate-900">{p.name}</span>
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  formData.studyProgramId === p.id
                                    ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                                    : 'border-slate-300'
                                }`}
                              >
                                {formData.studyProgramId === p.id && <Check className="w-2.5 h-2.5" />}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span>{p.facultyName}</span>
                              <span>•</span>
                              <span className="font-semibold text-amber-700">Akreditasi: {p.accreditation || 'Unggul'}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 text-amber-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Tidak ada program studi yang ditemukan untuk jenjang {selectedJenjang}.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: DATA KEPENDUDUKAN & PRIBADI */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor Induk Kependudukan (NIK) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="16 digit sesuai KTP/KK"
                        value={formData.nik}
                        onChange={(e) => setFormData((p) => ({ ...p, nik: e.target.value.replace(/[^0-9]/g, '') }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap Sesuai Ijazah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                        onBlur={(e) => setFormData((p) => ({ ...p, fullName: toTitleCase(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        placeholder="Kota / Kabupaten"
                        value={formData.birthPlace}
                        onChange={(e) => setFormData((p) => ({ ...p, birthPlace: e.target.value }))}
                        onBlur={(e) => setFormData((p) => ({ ...p, birthPlace: toTitleCase(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Agama</label>
                      <select
                        value={formData.religion}
                        onChange={(e) => setFormData((p) => ({ ...p, religion: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        <option value="Islam">Islam</option>
                        <option value="Kristen Protestan">Kristen Protestan</option>
                        <option value="Katolik">Katolik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option>
                        <option value="Konghucu">Konghucu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kewarganegaraan / Negara Asal <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addressState.country}
                        onChange={(e) => setAddressState((prev) => ({ ...prev, country: e.target.value }))}
                        placeholder="Indonesia"
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>
                  </div>

                  {/* ALAMAT DOMISILI STANDAR KEMENDAGRI (API WILAYAH INDONESIA) */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Alamat Domisili Sesuai KTP / KK <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Pilih wilayah administrasi resmi (Provinsi, Kota/Kabupaten, Kecamatan, Kelurahan)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200">
                        Standar Kemendagri RI
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. Provinsi */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Provinsi <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={addressState.provinceId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const prov = provinces.find((p) => p.id === id);
                            setAddressState((prev) => ({
                              ...prev,
                              provinceId: id,
                              provinceName: prov ? toTitleCase(prov.name) : '',
                              regencyId: '',
                              regencyName: '',
                              districtId: '',
                              districtName: '',
                              villageId: '',
                              villageName: '',
                            }));
                          }}
                          disabled={loadingProvinces}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer"
                        >
                          <option value="">{loadingProvinces ? 'Memuat daftar provinsi...' : '-- Pilih Provinsi --'}</option>
                          {provinces.map((p) => (
                            <option key={p.id} value={p.id}>
                              {toTitleCase(p.name)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Kota / Kabupaten */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kota / Kabupaten <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={addressState.regencyId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const reg = regencies.find((r) => r.id === id);
                            setAddressState((prev) => ({
                              ...prev,
                              regencyId: id,
                              regencyName: reg ? toTitleCase(reg.name) : '',
                              districtId: '',
                              districtName: '',
                              villageId: '',
                              villageName: '',
                            }));
                          }}
                          disabled={!addressState.provinceId || loadingRegencies}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!addressState.provinceId
                              ? '-- Pilih Provinsi Terlebih Dahulu --'
                              : loadingRegencies
                              ? 'Memuat data kabupaten/kota...'
                              : '-- Pilih Kota / Kabupaten --'}
                          </option>
                          {regencies.map((r) => (
                            <option key={r.id} value={r.id}>
                              {toTitleCase(r.name)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Kecamatan */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kecamatan <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={addressState.districtId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const dist = districts.find((d) => d.id === id);
                            setAddressState((prev) => ({
                              ...prev,
                              districtId: id,
                              districtName: dist ? toTitleCase(dist.name) : '',
                              villageId: '',
                              villageName: '',
                            }));
                          }}
                          disabled={!addressState.regencyId || loadingDistricts}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!addressState.regencyId
                              ? '-- Pilih Kota/Kabupaten Dulu --'
                              : loadingDistricts
                              ? 'Memuat data kecamatan...'
                              : '-- Pilih Kecamatan --'}
                          </option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {toTitleCase(d.name)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 4. Kelurahan / Desa */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Kelurahan / Desa <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const next = !isManualVillage;
                              setIsManualVillage(next);
                              if (next) {
                                setAddressState((prev) => ({ ...prev, villageId: 'MANUAL', villageName: '' }));
                              } else {
                                setAddressState((prev) => ({ ...prev, villageId: '', villageName: '' }));
                              }
                            }}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {isManualVillage ? '← Pilih dari Daftar' : '+ Tidak ada di daftar? Ketik Manual'}
                          </button>
                        </div>

                        {isManualVillage ? (
                          <input
                            type="text"
                            placeholder="Ketik nama Kelurahan / Desa Anda..."
                            value={addressState.villageName}
                            onChange={(e) =>
                              setAddressState((prev) => ({
                                ...prev,
                                villageId: 'MANUAL',
                                villageName: e.target.value,
                              }))
                            }
                            onBlur={(e) =>
                              setAddressState((prev) => ({
                                ...prev,
                                villageName: toTitleCase(e.target.value),
                              }))
                            }
                            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-blue-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-blue-50/20 font-semibold"
                          />
                        ) : (
                          <select
                            value={addressState.villageId}
                            onChange={(e) => {
                              const id = e.target.value;
                              if (id === '__MANUAL__') {
                                setIsManualVillage(true);
                                setAddressState((prev) => ({ ...prev, villageId: 'MANUAL', villageName: '' }));
                                return;
                              }
                              const vil = villages.find((v) => v.id === id);
                              setAddressState((prev) => ({
                                ...prev,
                                villageId: id,
                                villageName: vil ? toTitleCase(vil.name) : '',
                              }));
                            }}
                            disabled={!addressState.districtId || loadingVillages}
                            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {!addressState.districtId
                                ? '-- Pilih Kecamatan Dulu --'
                                : loadingVillages
                                ? 'Memuat data kelurahan/desa...'
                                : '-- Pilih Kelurahan / Desa --'}
                            </option>
                            {villages.map((v) => (
                              <option key={v.id} value={v.id}>
                                {toTitleCase(v.name)}
                              </option>
                            ))}
                            {addressState.districtId && !loadingVillages && (
                              <option value="__MANUAL__" className="font-semibold text-blue-600">
                                + Tidak ada di daftar? Ketik Manual...
                              </option>
                            )}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* RT/RW, Kode Pos & Detail Jalan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">RT / RW (Opsional)</label>
                        <input
                          type="text"
                          placeholder="Contoh: 004 / 007"
                          value={addressState.rtRw}
                          onChange={(e) => setAddressState((prev) => ({ ...prev, rtRw: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Kode Pos</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="5 digit kode pos"
                          value={addressState.postalCode}
                          onChange={(e) => setAddressState((prev) => ({ ...prev, postalCode: e.target.value.replace(/[^0-9]/g, '') }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Alamat Jalan / Gang / No. Rumah / Blok <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Contoh: Jl. Diponegoro No. 45, Komplek Perumahan Griya Indah Blok C3"
                          value={addressState.streetAddress}
                          onChange={(e) => setAddressState((prev) => ({ ...prev, streetAddress: e.target.value }))}
                          onBlur={(e) => setAddressState((prev) => ({ ...prev, streetAddress: toTitleCase(e.target.value) }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DATA ASAL SEKOLAH */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Nama Asal Sekolah / Perguruan Tinggi <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200 flex items-center gap-1">
                          <Search className="w-2.5 h-2.5" />
                          Database Sekolah Kemendikbud RI
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ketik nama sekolah atau kecamatan (misal: SMAN 1 Sidareja / Cilacap)..."
                          value={formData.schoolName}
                          onChange={(e) => handleSchoolNameChange(e.target.value)}
                          onFocus={() => {
                            if (formData.schoolName.trim().length >= 3) {
                              setShowSchoolDropdown(true);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowSchoolDropdown(false);
                              setFormData((p) => ({ ...p, schoolName: toTitleCase(p.schoolName) }));
                            }, 250);
                          }}
                          className="w-full pl-9 pr-8 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        {isSearchingSchool && (
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-3 top-3" />
                        )}
                      </div>

                      {/* Dropdown Suggestions */}
                      {showSchoolDropdown && formData.schoolName.trim().length >= 3 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto divide-y divide-slate-100">
                          {isSearchingSchool && schoolSuggestions.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                              <span>Mencari di database sekolah nasional...</span>
                            </div>
                          ) : schoolSuggestions.length > 0 ? (
                            <div>
                              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Rekomendasi Sekolah Resmi Kemendikbud ({schoolSuggestions.length} ditemukan)
                              </div>
                              {schoolSuggestions.map((item) => (
                                <button
                                  type="button"
                                  key={item.id || item.npsn}
                                  onMouseDown={() => handleSelectSchool(item)}
                                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/80 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs text-slate-800 group-hover:text-blue-900">
                                        {item.name}
                                      </span>
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                        {item.bentuk}
                                      </span>
                                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        {item.status}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {item.district && `Kec. ${item.district}, `}
                                      {item.regency && `${item.regency}, `}
                                      {item.province}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                                      NPSN: {item.npsn}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-xs text-slate-500 text-center">
                              Sekolah tidak ada di rekomendasi online? Anda dapat langsung menggunakan teks yang Anda ketik.
                            </div>
                          )}
                        </div>
                      )}

                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Ketik minimal 3 karakter untuk mencari sekolah di Indonesia secara otomatis (NPSN akan otomatis terisi).
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NPSN Sekolah (Otomatis / Manual)
                      </label>
                      <input
                        type="text"
                        placeholder="8 digit NPSN"
                        value={formData.npsn}
                        onChange={(e) => setFormData((p) => ({ ...p, npsn: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NISN (Nomor Induk Siswa Nasional)
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="10 digit NISN"
                        value={formData.nisn}
                        onChange={(e) => setFormData((p) => ({ ...p, nisn: e.target.value.replace(/[^0-9]/g, '') }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">Dapat ditemukan di ijazah / kartu pelajar atau melalui nisn.data.kemdikbud.go.id</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jurusan di Sekolah</label>
                      <input
                        type="text"
                        placeholder="Contoh: MIPA / IPS / Rekayasa Perangkat Lunak"
                        value={formData.major}
                        onChange={(e) => setFormData((p) => ({ ...p, major: e.target.value }))}
                        onBlur={(e) => setFormData((p) => ({ ...p, major: toTitleCase(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Kelulusan</label>
                      <select
                        value={formData.graduationYear}
                        onChange={(e) => setFormData((p) => ({ ...p, graduationYear: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        <option value="2027">2027 (Lulus Tahun Ini)</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023 atau Sebelumnya</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: ORANG TUA / WALI */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Orang Tua / Wali <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.parentName}
                        onChange={(e) => setFormData((p) => ({ ...p, parentName: e.target.value }))}
                        onBlur={(e) => setFormData((p) => ({ ...p, parentName: toTitleCase(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor WhatsApp Orang Tua / Wali <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData((p) => ({ ...p, parentPhone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan Orang Tua</label>
                      <input
                        type="text"
                        placeholder="Contoh: Karyawan Swasta / PNS / Wiraswasta"
                        value={formData.parentJob}
                        onChange={(e) => setFormData((p) => ({ ...p, parentJob: e.target.value }))}
                        onBlur={(e) => setFormData((p) => ({ ...p, parentJob: toTitleCase(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Penghasilan</label>
                      <select
                        value={formData.parentIncome}
                        onChange={(e) => setFormData((p) => ({ ...p, parentIncome: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        <option value="< Rp2.000.000">&lt; Rp2.000.000</option>
                        <option value="Rp2.000.000 - Rp5.000.000">Rp2.000.000 - Rp5.000.000</option>
                        <option value="Rp5.000.000 - Rp10.000.000">Rp5.000.000 - Rp10.000.000</option>
                        <option value="> Rp10.000.000">&gt; Rp10.000.000</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: DOKUMEN & FINALISASI */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Dokumen Pendaftaran (Dapat diunggah kemudian jika belum siap)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                        <label className="block text-xs font-bold text-slate-800 mb-1">Kartu Tanda Penduduk (KTP)</label>
                        <input
                          type="text"
                          placeholder="Nama file / URL dokumen KTP"
                          value={formData.fileKtp}
                          onChange={(e) => setFormData((p) => ({ ...p, fileKtp: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                        <label className="block text-xs font-bold text-slate-800 mb-1">Kartu Keluarga (KK)</label>
                        <input
                          type="text"
                          placeholder="Nama file / URL dokumen KK"
                          value={formData.fileKk}
                          onChange={(e) => setFormData((p) => ({ ...p, fileKk: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                        <label className="block text-xs font-bold text-slate-800 mb-1">Ijazah / SKL / Rapor</label>
                        <input
                          type="text"
                          placeholder="Nama file / URL Ijazah atau Rapor"
                          value={formData.fileIjazah}
                          onChange={(e) => setFormData((p) => ({ ...p, fileIjazah: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                        <label className="block text-xs font-bold text-slate-800 mb-1">Pas Foto 3x4 Resmi</label>
                        <input
                          type="text"
                          placeholder="Nama file / URL pas foto terbaru"
                          value={formData.fileFoto}
                          onChange={(e) => setFormData((p) => ({ ...p, fileFoto: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agreement Checkbox */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreement"
                      checked={formData.statementAgreed}
                      onChange={(e) => setFormData((p) => ({ ...p, statementAgreed: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-[#1E3A8A] rounded-sm focus:ring-[#1E3A8A] cursor-pointer"
                    />
                    <label htmlFor="agreement" className="text-xs text-slate-700 cursor-pointer">
                      Saya menyatakan bahwa seluruh data dan dokumen yang saya isikan pada formulir pendaftaran ini adalah benar, sah, dan dapat dipertanggungjawabkan sesuai peraturan yang berlaku di Institut Teknologi Nusantara.
                    </label>
                  </div>
                </div>
              )}

              {/* Wizard Nav Buttons */}
              <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Draf</span>
                  </button>

                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Lanjutkan</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitApplication}
                      disabled={isSaving || !formData.statementAgreed}
                      className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSaving ? 'Memproses...' : 'Kirim Pendaftaran'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Upload Bukti Pembayaran */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Konfirmasi Pembayaran:{' '}
                  {selectedPayment.type === 'REGISTRATION' ? 'Biaya Registrasi' : 'Biaya Daftar Ulang'}
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <span className="text-slate-600 block">Nominal yang harus dibayarkan:</span>
                <span className="text-lg font-black text-[#1E3A8A] font-mono block">
                  Rp{selectedPayment.amount.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Tujuan: Bank BNI VA 8802 0812 7643 8553 a.n ITN PMB
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="Transfer Bank BNI">Transfer Bank BNI (Virtual Account)</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="Transfer Bank BCA / Lainnya">Transfer Antar Bank (BCA/BRI/Lainnya)</option>
                    <option value="Teller Bank / Kasir">Pembayaran Tunai di Kasir Kampus</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama File / URL Bukti Transfer</label>
                  <input
                    type="text"
                    placeholder="Contoh: bukti-bni-reg.jpg atau link foto resi"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Unggah bukti resi transaksi m-banking atau slip setoran bank.
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isUploadingPayment}
                  className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  {isUploadingPayment ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer PMB */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1">
          <p className="font-bold text-slate-300">
            Panitia Penerimaan Mahasiswa Baru (PMB) • Institut Teknologi Nusantara (ITN)
          </p>
          <p className="text-[11px] text-slate-500">
            Kampus Utama: Jl. Boulevard Teknologi No. 1, Jakarta • Hotline: (021) 7890-1234 • WhatsApp PMB: 0812-3456-7890
          </p>
        </div>
      </footer>
    </div>
  );
}
