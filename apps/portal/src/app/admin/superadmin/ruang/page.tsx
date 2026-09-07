'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  DoorOpen,
  Building2,
  Users,
  Monitor,
  Search,
  Plus,
  Download,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Layers,
  Tv,
  Wifi,
  Sparkles,
  Award,
} from 'lucide-react';

interface RoomItem {
  id: string;
  code: string;
  name: string;
  buildingCode: 'TWR-A' | 'TWR-B' | 'TWR-C' | 'TWR-D' | 'GRH-NUT' | 'HUB-INOV';
  buildingName: string;
  floor: number;
  type: 'Kelas Teori' | 'Lab Komputer' | 'Lab Teknik' | 'Studio Desain' | 'Auditorium & Seminar';
  capacity: number;
  facilities: string[];
  status: 'Tersedia' | 'Sedang Digunakan' | 'Dalam Pemeliharaan';
  notes: string;
}

const initialRooms: RoomItem[] = [
  {
    id: 'r-1',
    code: 'A-201',
    name: 'Smart Classroom Teori 201',
    buildingCode: 'TWR-A',
    buildingName: 'Gedung BJ Habibie (Tower A)',
    floor: 2,
    type: 'Kelas Teori',
    capacity: 50,
    facilities: ['Smart TV 75"', 'AC Inverter (2 Unit)', 'Sound System & Mic Wireless', 'Wi-Fi 6', 'Whiteboard Kaca'],
    status: 'Tersedia',
    notes: 'Ruang kelas teori utama program sarjana Teknik Informatika & Sistem Informasi.',
  },
  {
    id: 'r-2',
    code: 'A-301',
    name: 'Laboratorium AI & Data Science',
    buildingCode: 'TWR-A',
    buildingName: 'Gedung BJ Habibie (Tower A)',
    floor: 3,
    type: 'Lab Komputer',
    capacity: 40,
    facilities: ['40 Unit Workstation Core i7 RTX 4070', 'Gigabit LAN', 'Interactive Screen', 'AC Central'],
    status: 'Sedang Digunakan',
    notes: 'Praktikum Machine Learning, Computer Vision, dan Big Data Analytics.',
  },
  {
    id: 'r-3',
    code: 'A-402',
    name: 'Laboratorium Jaringan & Cyber Security',
    buildingCode: 'TWR-A',
    buildingName: 'Gedung BJ Habibie (Tower A)',
    floor: 4,
    type: 'Lab Komputer',
    capacity: 36,
    facilities: ['Cisco Routers & Switches Rack', 'Patch Panel', 'Server Virtualisasi Proxmox', 'AC 2x2 PK'],
    status: 'Tersedia',
    notes: 'Sertifikasi CCNA, praktikum keamanan siber, dan ethical hacking.',
  },
  {
    id: 'r-4',
    code: 'C-101',
    name: 'Bengkel Manufaktur & CNC Mesin',
    buildingCode: 'TWR-C',
    buildingName: 'Gedung Soekarno (Tower C)',
    floor: 1,
    type: 'Lab Teknik',
    capacity: 30,
    facilities: ['Mesin Bubut CNC 5-Axis', 'Mesin Milling', 'Alat Uji Tarik Logam', 'Exhaust Fan Industri'],
    status: 'Tersedia',
    notes: 'Praktikum teknologi mekanik & manufaktur presisi mahasiswa FTI.',
  },
  {
    id: 'r-5',
    code: 'C-205',
    name: 'Laboratorium Elektronika Daya & PLC',
    buildingCode: 'TWR-C',
    buildingName: 'Gedung Soekarno (Tower C)',
    floor: 2,
    type: 'Lab Teknik',
    capacity: 35,
    facilities: ['Siemens PLC Trainer Kit', 'Oscilloscope Digital Rigol', 'Power Supply DC 3-Phase', 'AC'],
    status: 'Sedang Digunakan',
    notes: 'Praktikum sistem otomasi industri dan instrumentasi elektro.',
  },
  {
    id: 'r-6',
    code: 'B-201',
    name: 'Lab Simulasi Perbankan & FinTech',
    buildingCode: 'TWR-B',
    buildingName: 'Gedung Mohammad Hatta (Tower B)',
    floor: 2,
    type: 'Lab Komputer',
    capacity: 45,
    facilities: ['Terminal Bloomberg Simulasi', '35 PC Core i5', 'Ticker Saham Running Text', 'AC'],
    status: 'Tersedia',
    notes: 'Laboratorium transaksi keuangan digital, akuntansi, dan trading saham BEI.',
  },
  {
    id: 'r-7',
    code: 'B-302',
    name: 'Kelas Eksekutif Bisnis Digital',
    buildingCode: 'TWR-B',
    buildingName: 'Gedung Mohammad Hatta (Tower B)',
    floor: 3,
    type: 'Kelas Teori',
    capacity: 40,
    facilities: ['Meja Melengkung Eksekutif', 'Proyektor Laser HD', 'Microphone Delegasi', 'Full AC'],
    status: 'Tersedia',
    notes: 'Presentasi studi kasus bisnis dan kuliah tamu CEO industri.',
  },
  {
    id: 'r-8',
    code: 'D-102',
    name: 'Studio Fotografi & Pencahayaan',
    buildingCode: 'TWR-D',
    buildingName: 'Gedung Ki Hajar Dewantara (Tower D)',
    floor: 1,
    type: 'Studio Desain',
    capacity: 25,
    facilities: ['Lighting Softbox Godox', 'Green Screen Cyclorama 6x4m', 'Kamera Sony A7 IV', 'AC Khusus'],
    status: 'Tersedia',
    notes: 'Studio pemotretan komersial, produksi video, dan animasi stop-motion.',
  },
  {
    id: 'r-9',
    code: 'D-301',
    name: 'Studio Rendering 3D & Desain Grafis',
    buildingCode: 'TWR-D',
    buildingName: 'Gedung Ki Hajar Dewantara (Tower D)',
    floor: 3,
    type: 'Studio Desain',
    capacity: 32,
    facilities: ['Apple Mac Studio M2 Max (30 Unit)', 'Drawing Tablet Wacom Cintiq', 'Color Calibrated Monitor'],
    status: 'Sedang Digunakan',
    notes: 'Praktikum modeling 3D Blender/Maya, animasi digital, dan desain UI/UX.',
  },
  {
    id: 'r-10',
    code: 'GRH-AUD',
    name: 'Auditorium Utama Graha Nusantara',
    buildingCode: 'GRH-NUT',
    buildingName: 'Graha Nusantara (Rektorat)',
    floor: 3,
    type: 'Auditorium & Seminar',
    capacity: 450,
    facilities: ['Videowall LED P2.5 12x4m', 'Line Array Sound JBL', 'Kursi Teater Busa', 'Central AC Chiller'],
    status: 'Tersedia',
    notes: 'Kuliah umum perdana, seminar nasional, wisuda fakultas, dan orasi ilmiah.',
  },
  {
    id: 'r-11',
    code: 'HUB-201',
    name: 'Co-Working Space Riset Mahasiswa',
    buildingCode: 'HUB-INOV',
    buildingName: 'Pusat Riset & Hub Inovasi Digital',
    floor: 2,
    type: 'Auditorium & Seminar',
    capacity: 60,
    facilities: ['Hot Desk Fleksibel', 'High Speed Wi-Fi 500 Mbps', 'Pantry & Coffee Station', 'AC'],
    status: 'Tersedia',
    notes: 'Ruang kerja kolaboratif startup mahasiswa binaan inkubator bisnis ITN.',
  },
  {
    id: 'r-12',
    code: 'A-105',
    name: 'Ruang Kuliah Teori A-105',
    buildingCode: 'TWR-A',
    buildingName: 'Gedung BJ Habibie (Tower A)',
    floor: 1,
    type: 'Kelas Teori',
    capacity: 45,
    facilities: ['Smart Board', 'AC 2x1.5 PK', 'Sound System', 'Kursi Kuliah Chitose'],
    status: 'Dalam Pemeliharaan',
    notes: 'Sedang perbaikan instalasi sistem pendingin udara (AC).',
  },
];

function RuangContent() {
  const searchParams = useSearchParams();
  const initialBuildingParam = searchParams.get('building');

  const [rooms, setRooms] = useState<RoomItem[]>(initialRooms);
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>(initialBuildingParam || 'Semua');
  const [typeFilter, setTypeFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialBuildingParam) {
      setBuildingFilter(initialBuildingParam);
    }
  }, [initialBuildingParam]);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    buildingCode: RoomItem['buildingCode'];
    buildingName: string;
    floor: number;
    type: RoomItem['type'];
    capacity: number;
    facilitiesInput: string;
    status: RoomItem['status'];
    notes: string;
  }>({
    code: '',
    name: '',
    buildingCode: 'TWR-A',
    buildingName: 'Gedung BJ Habibie (Tower A)',
    floor: 2,
    type: 'Kelas Teori',
    capacity: 40,
    facilitiesInput: 'Smart TV, AC, Proyektor, Wi-Fi 6',
    status: 'Tersedia',
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<string>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, buildingFilter, typeFilter, statusFilter]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.facilities.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBuilding =
        buildingFilter === 'Semua' || r.buildingCode === buildingFilter;
      const matchType = typeFilter === 'Semua' || r.type === typeFilter;
      const matchStatus = statusFilter === 'Semua' || r.status === statusFilter;

      return matchSearch && matchBuilding && matchType && matchStatus;
    });
  }, [rooms, searchQuery, buildingFilter, typeFilter, statusFilter]);

  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      const aVal: any = (a as any)[sortField];
      const bVal: any = (b as any)[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filteredRooms, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedRooms.length / itemsPerPage));
  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRooms.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRooms, currentPage, itemsPerPage]);

  const metrics = useMemo(() => {
    const totalRuang = rooms.length;
    const kelasTeori = rooms.filter((r) => r.type === 'Kelas Teori').length;
    const labStudio = rooms.filter((r) => r.type === 'Lab Komputer' || r.type === 'Lab Teknik' || r.type === 'Studio Desain').length;
    const auditorium = rooms.filter((r) => r.type === 'Auditorium & Seminar').length;
    return { totalRuang, kelasTeori, labStudio, auditorium };
  }, [rooms]);

  const getBuildingNameByCode = (code: string) => {
    switch (code) {
      case 'TWR-A':
        return 'Gedung BJ Habibie (Tower A)';
      case 'TWR-B':
        return 'Gedung Mohammad Hatta (Tower B)';
      case 'TWR-C':
        return 'Gedung Soekarno (Tower C)';
      case 'TWR-D':
        return 'Gedung Ki Hajar Dewantara (Tower D)';
      case 'GRH-NUT':
        return 'Graha Nusantara (Rektorat)';
      case 'HUB-INOV':
        return 'Pusat Riset & Hub Inovasi Digital';
      default:
        return 'Gedung Kampus ITN';
    }
  };

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setFormData({
      code: '',
      name: '',
      buildingCode: 'TWR-A',
      buildingName: 'Gedung BJ Habibie (Tower A)',
      floor: 2,
      type: 'Kelas Teori',
      capacity: 40,
      facilitiesInput: 'Smart TV, AC, Proyektor, Wi-Fi 6',
      status: 'Tersedia',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: RoomItem) => {
    setEditingRoom(r);
    setFormData({
      code: r.code,
      name: r.name,
      buildingCode: r.buildingCode,
      buildingName: r.buildingName,
      floor: r.floor,
      type: r.type,
      capacity: r.capacity,
      facilitiesInput: r.facilities.join(', '),
      status: r.status,
      notes: r.notes,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const facilitiesArray = formData.facilitiesInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const resolvedBuildingName = getBuildingNameByCode(formData.buildingCode);

    if (editingRoom) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === editingRoom.id
            ? {
                ...r,
                ...formData,
                buildingName: resolvedBuildingName,
                floor: Number(formData.floor),
                capacity: Number(formData.capacity),
                facilities: facilitiesArray,
              }
            : r
        )
      );
      showToast(`Data ruang "${formData.name}" berhasil diperbarui.`);
    } else {
      const newRoom: RoomItem = {
        id: `r-${Date.now()}`,
        ...formData,
        buildingName: resolvedBuildingName,
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
        facilities: facilitiesArray,
      };
      setRooms([newRoom, ...rooms]);
      showToast(`Ruangan baru "${formData.name}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus ruangan "${name}"? Jadwal perkuliahan di ruang ini akan dibatalkan.`)) {
      setRooms((prev) => prev.filter((r) => r.id !== id));
      showToast(`Ruangan "${name}" berhasil dihapus.`);
    }
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Kepala BAAK & Sistem Akademik Kampus"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/admin/superadmin" className="hover:text-[#1E3A8A] transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Master Data</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1E3A8A] font-bold">Ruang Kuliah & Lab</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <DoorOpen className="w-7 h-7 text-[#1E3A8A]" />
              <span>Manajemen Ruang Perkuliahan & Lab</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Inventaris ruang kelas teori, laboratorium komputasi/rekayasa, studio kreatif, dan auditorium kampus ITN.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/superadmin/gedung"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Data Gedung</span>
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Tambah Ruangan Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Ruangan</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.totalRuang} Ruang</h3>
              <p className="text-xs text-slate-500 mt-0.5">Seluruh sarana perkuliahan</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <DoorOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas Teori Utama</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.kelasTeori} Kelas</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Dilengkapi Smart Classroom</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <Tv className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Laboratorium & Studio</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{metrics.labStudio} Lab/Studio</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Komputer, Teknik & Desain</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <Monitor className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Auditorium & Aula</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{metrics.auditorium} Ruang</h3>
              <p className="text-xs text-slate-500 mt-0.5">Kapasitas besar & seminar</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode ruang (A-201), nama ruangan, atau fasilitas..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Gedung */}
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Gedung</option>
              <option value="TWR-A">Tower A (BJ Habibie)</option>
              <option value="TWR-B">Tower B (M. Hatta)</option>
              <option value="TWR-C">Tower C (Soekarno)</option>
              <option value="TWR-D">Tower D (Ki Hajar Dewantara)</option>
              <option value="GRH-NUT">Graha Nusantara</option>
              <option value="HUB-INOV">Hub Inovasi Digital</option>
            </select>

            {/* Filter Tipe Ruangan */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Tipe Ruang</option>
              <option value="Kelas Teori">Kelas Teori</option>
              <option value="Lab Komputer">Lab Komputer</option>
              <option value="Lab Teknik">Lab Teknik</option>
              <option value="Studio Desain">Studio Desain</option>
              <option value="Auditorium & Seminar">Auditorium & Seminar</option>
            </select>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Sedang Digunakan">Sedang Digunakan</option>
              <option value="Dalam Pemeliharaan">Dalam Pemeliharaan</option>
            </select>

            {(searchQuery || buildingFilter !== 'Semua' || typeFilter !== 'Semua' || statusFilter !== 'Semua') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setBuildingFilter('Semua');
                  setTypeFilter('Semua');
                  setStatusFilter('Semua');
                }}
                className="text-xs text-rose-600 hover:underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Ruang Perkuliahan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Kode & Ruang */}
                  <th
                    onClick={() => handleSort('code')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan kode ruang"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kode & Nama Ruangan</span>
                      {sortField === 'code' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Gedung & Lantai */}
                  <th
                    onClick={() => handleSort('buildingName')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan gedung"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Gedung & Lantai</span>
                      {sortField === 'buildingName' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Tipe Ruangan */}
                  <th
                    onClick={() => handleSort('type')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan tipe ruang"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Tipe Ruang</span>
                      {sortField === 'type' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Kapasitas */}
                  <th
                    onClick={() => handleSort('capacity')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan kapasitas"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Kapasitas</span>
                      {sortField === 'capacity' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  <th className="py-3.5 px-4">Fasilitas Utama</th>

                  {/* Sort: Status */}
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan status ruangan"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRooms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <DoorOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada data ruangan ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci atau filter gedung Anda</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-xs font-black text-[#1E3A8A] bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 shrink-0 mt-0.5">
                            {r.code}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-sm leading-snug">{r.name}</div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{r.notes}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-xs">{r.buildingName}</div>
                        <span className="text-[10px] text-slate-500 font-semibold">Lantai {r.floor}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.type === 'Kelas Teori'
                              ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                              : r.type === 'Lab Komputer'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : r.type === 'Lab Teknik'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : r.type === 'Studio Desain'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-slate-900 text-sm">{r.capacity}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">Kursi</span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {r.facilities.slice(0, 3).map((f, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium line-clamp-1"
                            >
                              {f}
                            </span>
                          ))}
                          {r.facilities.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-bold px-1">
                              +{r.facilities.length - 3} lagi
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'Tersedia'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'Sedang Digunakan'
                                ? 'bg-blue-100 text-[#1E3A8A]'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status === 'Tersedia'
                                ? 'bg-emerald-500'
                                : r.status === 'Sedang Digunakan'
                                  ? 'bg-[#1E3A8A]'
                                  : 'bg-rose-500'
                            }`}
                          ></span>
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Ruangan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Ruangan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>Semua (20)</option>
              </select>
              <span>per halaman</span>
              <span className="text-slate-400 ml-2 hidden md:inline">
                &bull; Menampilkan {Math.min(filteredRooms.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredRooms.length)} dari {filteredRooms.length} ruangan
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Tambah / Edit Ruangan */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRoom ? 'Edit Data Ruangan' : 'Tambah Ruangan Baru'}
          subtitle="Sarana perkuliahan & riset Institut Teknologi Nusantara"
          icon={<DoorOpen className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Ruangan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A-301"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kapasitas Kursi (Orang) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={600}
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Ruangan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ruang Teori Multimedia 301"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lokasi Gedung <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.buildingCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          buildingCode: e.target.value as RoomItem['buildingCode'],
                          buildingName: getBuildingNameByCode(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="TWR-A">Gedung BJ Habibie (Tower A)</option>
                      <option value="TWR-B">Gedung Mohammad Hatta (Tower B)</option>
                      <option value="TWR-C">Gedung Soekarno (Tower C)</option>
                      <option value="TWR-D">Gedung Ki Hajar Dewantara (Tower D)</option>
                      <option value="GRH-NUT">Graha Nusantara (Rektorat)</option>
                      <option value="HUB-INOV">Pusat Riset & Hub Inovasi Digital</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Lantai</label>
                    <select
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6].map((fl) => (
                        <option key={fl} value={fl}>
                          Lantai {fl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipe / Fungsi Ruang</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as RoomItem['type'] })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="Kelas Teori">Kelas Teori</option>
                      <option value="Lab Komputer">Lab Komputer</option>
                      <option value="Lab Teknik">Lab Teknik</option>
                      <option value="Studio Desain">Studio Desain</option>
                      <option value="Auditorium & Seminar">Auditorium & Seminar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Ketersediaan</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as RoomItem['status'] })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="Tersedia">Tersedia</option>
                      <option value="Sedang Digunakan">Sedang Digunakan</option>
                      <option value="Dalam Pemeliharaan">Dalam Pemeliharaan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fasilitas Ruangan (Pisahkan dengan tanda koma)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Smart TV 75 inch, AC (2 Unit), Sound System, Wi-Fi 6"
                    value={formData.facilitiesInput}
                    onChange={(e) => setFormData({ ...formData, facilitiesInput: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Keterangan Ruangan</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan khusus pemakaian atau peruntukan ruang..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all shadow-xs"
                  >
                    {editingRoom ? 'Simpan Perubahan' : 'Tambah Ruangan'}
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}

export default function SuperAdminRuangPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading...</div>}>
      <RuangContent />
    </Suspense>
  );
}
