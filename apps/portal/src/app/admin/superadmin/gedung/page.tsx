'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  Building2,
  Landmark,
  Layers,
  Users,
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
  MapPin,
  Phone,
  DoorOpen,
  Wrench,
} from 'lucide-react';

interface BuildingItem {
  id: string;
  code: string;
  name: string;
  alias: string;
  functionDesc: string;
  floorsCount: number;
  roomsCount: number;
  capacity: number;
  picName: string;
  picPhone: string;
  status: 'Aktif Beroperasi' | 'Dalam Pemeliharaan';
  establishedYear: number;
  description: string;
}

const initialBuildings: BuildingItem[] = [
  {
    id: 'b-1',
    code: 'TWR-A',
    name: 'Gedung BJ Habibie',
    alias: 'Tower A - Fakultas Ilmu Komputer',
    functionDesc: 'Dekanat FASILKOM, Lab Kecerdasan Buatan, Lab Jaringan, dan Ruang Kuliah Teori.',
    floorsCount: 6,
    roomsCount: 24,
    capacity: 2400,
    picName: 'Heri Susanto, S.T. (Urusan Rumah Tangga A)',
    picPhone: '0812-3456-7890',
    status: 'Aktif Beroperasi',
    establishedYear: 2018,
    description: 'Tower modern 6 lantai dengan fasilitas fiber optic 10 Gbps, smart classroom, dan data center kampus.',
  },
  {
    id: 'b-2',
    code: 'TWR-C',
    name: 'Gedung Soekarno',
    alias: 'Tower C - Fakultas Teknik & Industri',
    functionDesc: 'Dekanat FTI, Workshop Mekatronika, Laboratorium Listrik Tenaga, dan Bengkel Mesin CNC.',
    floorsCount: 5,
    roomsCount: 28,
    capacity: 2200,
    picName: 'Bambang Irawan (Urusan Rumah Tangga C)',
    picPhone: '0813-9876-5432',
    status: 'Aktif Beroperasi',
    establishedYear: 2016,
    description: 'Fasilitas rekayasa terpadu dengan daya listrik industri 3-phase dan sistem ventilasi sirkulasi udara khusus.',
  },
  {
    id: 'b-3',
    code: 'TWR-B',
    name: 'Gedung Mohammad Hatta',
    alias: 'Tower B - Fakultas Ekonomi & Bisnis',
    functionDesc: 'Dekanat FEBD, Laboratorium FinTech, Galeri Investasi BEI, dan Ruang Kuliah Eksekutif.',
    floorsCount: 4,
    roomsCount: 18,
    capacity: 1800,
    picName: 'Rahmat Hidayat, A.Md. (URT B)',
    picPhone: '0857-1122-3344',
    status: 'Aktif Beroperasi',
    establishedYear: 2019,
    description: 'Pusat pembelajaran bisnis digital dilengkapi simulasi trading bursa efek dan auditorium mini.',
  },
  {
    id: 'b-4',
    code: 'TWR-D',
    name: 'Gedung Ki Hajar Dewantara',
    alias: 'Tower D - Fakultas Desain Komunikasi Visual',
    functionDesc: 'Dekanat FDKV, Studio Rendering 3D, Studio Motion Capture Animasi, dan Galeri Seni.',
    floorsCount: 4,
    roomsCount: 16,
    capacity: 1400,
    picName: 'Yusuf Maulana (URT D)',
    picPhone: '0821-4455-6677',
    status: 'Aktif Beroperasi',
    establishedYear: 2021,
    description: 'Gedung kreatif dengan akustik khusus, studio fotografi profesional, dan lab komputasi grafis Mac/Workstation.',
  },
  {
    id: 'b-5',
    code: 'GRH-NUT',
    name: 'Graha Nusantara (Rektorat & BAAK)',
    alias: 'Gedung Pusat Administrasi Kampus',
    functionDesc: 'Kantor Rektor & Wakil Rektor, Layanan Terpadu BAAK, Biro Keuangan, dan Balai Sidang Senat.',
    floorsCount: 4,
    roomsCount: 14,
    capacity: 800,
    picName: 'Ir. Joko Pramono (Kepala Sarana Prasarana)',
    picPhone: '0811-7788-9900',
    status: 'Aktif Beroperasi',
    establishedYear: 2015,
    description: 'Pusat pelayanan administratif sivitas akademika terpadu satu atap (One Stop Academic Service).',
  },
  {
    id: 'b-6',
    code: 'HUB-INOV',
    name: 'Pusat Riset & Hub Inovasi Digital',
    alias: 'Gedung Inkubator & Kolaborasi Industri',
    functionDesc: 'Coworking space riset multidisiplin, inkubator startup mahasiswa, dan laboratorium bersama mitra teknologi.',
    floorsCount: 3,
    roomsCount: 12,
    capacity: 600,
    picName: 'Didik Kurniawan, S.Kom. (Pengelola Hub)',
    picPhone: '0878-2233-4455',
    status: 'Aktif Beroperasi',
    establishedYear: 2023,
    description: 'Gedung riset terapan kolaboratif penghubung kampus dengan industri digital dan venture capital.',
  },
];

export default function SuperAdminGedungPage() {
  const [buildings, setBuildings] = useState<BuildingItem[]>(initialBuildings);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    alias: string;
    functionDesc: string;
    floorsCount: number;
    roomsCount: number;
    capacity: number;
    picName: string;
    picPhone: string;
    status: BuildingItem['status'];
    establishedYear: number;
    description: string;
  }>({
    code: '',
    name: '',
    alias: '',
    functionDesc: '',
    floorsCount: 4,
    roomsCount: 10,
    capacity: 1000,
    picName: '',
    picPhone: '',
    status: 'Aktif Beroperasi',
    establishedYear: 2022,
    description: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<string>('name');
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
  }, [searchQuery, statusFilter]);

  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.picName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'Semua' || b.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [buildings, searchQuery, statusFilter]);

  const sortedBuildings = useMemo(() => {
    return [...filteredBuildings].sort((a, b) => {
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
  }, [filteredBuildings, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedBuildings.length / itemsPerPage));
  const paginatedBuildings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedBuildings.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedBuildings, currentPage, itemsPerPage]);

  const metrics = useMemo(() => {
    const totalGedung = buildings.length;
    const totalLantai = buildings.reduce((acc, b) => acc + b.floorsCount, 0);
    const totalKapasitas = buildings.reduce((acc, b) => acc + b.capacity, 0);
    const totalRuang = buildings.reduce((acc, b) => acc + b.roomsCount, 0);
    return { totalGedung, totalLantai, totalKapasitas, totalRuang };
  }, [buildings]);

  const handleOpenAddModal = () => {
    setEditingBuilding(null);
    setFormData({
      code: '',
      name: '',
      alias: '',
      functionDesc: '',
      floorsCount: 4,
      roomsCount: 10,
      capacity: 1000,
      picName: '',
      picPhone: '',
      status: 'Aktif Beroperasi',
      establishedYear: 2022,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: BuildingItem) => {
    setEditingBuilding(b);
    setFormData({
      code: b.code,
      name: b.name,
      alias: b.alias,
      functionDesc: b.functionDesc,
      floorsCount: b.floorsCount,
      roomsCount: b.roomsCount,
      capacity: b.capacity,
      picName: b.picName,
      picPhone: b.picPhone,
      status: b.status,
      establishedYear: b.establishedYear,
      description: b.description,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingBuilding) {
      setBuildings((prev) =>
        prev.map((b) =>
          b.id === editingBuilding.id
            ? {
                ...b,
                ...formData,
                floorsCount: Number(formData.floorsCount),
                roomsCount: Number(formData.roomsCount),
                capacity: Number(formData.capacity),
                establishedYear: Number(formData.establishedYear),
              }
            : b
        )
      );
      showToast(`Data gedung "${formData.name}" berhasil diperbarui.`);
    } else {
      const newBuilding: BuildingItem = {
        id: `b-${Date.now()}`,
        ...formData,
        floorsCount: Number(formData.floorsCount),
        roomsCount: Number(formData.roomsCount),
        capacity: Number(formData.capacity),
        establishedYear: Number(formData.establishedYear),
      };
      setBuildings([...buildings, newBuilding]);
      showToast(`Gedung baru "${formData.name}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus data "${name}"? Ruangan terkait gedung ini akan terpengaruh.`)) {
      setBuildings((prev) => prev.filter((b) => b.id !== id));
      showToast(`Gedung "${name}" berhasil dihapus.`);
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
              <span className="text-[#1E3A8A] font-bold">Gedung Kampus</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-[#1E3A8A]" />
              <span>Manajemen Gedung & Sarana Fisik Kampus</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Infrastruktur gedung perkuliahan, dekanat fakultas, rektorat, dan pusat riset terpadu ITN.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/superadmin/ruang"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <DoorOpen className="w-4 h-4 text-slate-500" />
              <span>Lihat Daftar Ruangan</span>
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Tambah Gedung Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Gedung Kampus</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.totalGedung} Gedung</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tower & gedung administrasi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Lantai Fasilitas</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.totalLantai} Lantai</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Seluruh lantai terdata</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kapasitas Keseluruhan</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {metrics.totalKapasitas.toLocaleString('id-ID')}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Kapasitas mahasiswa & dosen</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Ruang Terdata</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{metrics.totalRuang} Ruangan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Kelas, lab & auditorium</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
              <DoorOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama gedung, kode, atau penanggung jawab..."
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

          <div className="flex items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Status Operasional</option>
              <option value="Aktif Beroperasi">Aktif Beroperasi</option>
              <option value="Dalam Pemeliharaan">Dalam Pemeliharaan</option>
            </select>
          </div>
        </div>

        {/* Table Gedung Kampus */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Gedung & Kode */}
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan nama gedung"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Gedung & Kode</span>
                      {sortField === 'name' ? (
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

                  {/* Sort: Fungsi / Peruntukan */}
                  <th
                    onClick={() => handleSort('functionDesc')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan peruntukan gedung"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Peruntukan & Fasilitas</span>
                      {sortField === 'functionDesc' ? (
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

                  {/* Sort: Jumlah Lantai */}
                  <th
                    onClick={() => handleSort('floorsCount')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan jumlah lantai"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Lantai</span>
                      {sortField === 'floorsCount' ? (
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

                  {/* Sort: Jumlah Ruang */}
                  <th
                    onClick={() => handleSort('roomsCount')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan jumlah ruangan"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Ruangan</span>
                      {sortField === 'roomsCount' ? (
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

                  {/* Sort: Kapasitas Total */}
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

                  {/* Sort: PIC Sarpras */}
                  <th
                    onClick={() => handleSort('picName')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan penanggung jawab"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Penanggung Jawab (URT)</span>
                      {sortField === 'picName' ? (
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

                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBuildings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada data gedung ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian Anda</p>
                    </td>
                  </tr>
                ) : (
                  paginatedBuildings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-blue-600 text-white font-black text-xs flex items-center justify-center border border-[#D4A017] shadow-xs shrink-0">
                            {b.code.substring(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{b.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] font-extrabold text-[#1E3A8A] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {b.code}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">{b.alias}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed">{b.functionDesc}</p>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-slate-900 text-xs">{b.floorsCount} Lantai</span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <Link
                          href={`/admin/superadmin/ruang?building=${b.code}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-extrabold text-xs transition-colors"
                          title="Lihat Ruangan Gedung Ini"
                        >
                          <span>{b.roomsCount} Ruang</span>
                        </Link>
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-emerald-700">
                        {b.capacity.toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900 text-xs">{b.picName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{b.picPhone}</span>
                        </p>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {b.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Gedung"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id, b.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Gedung"
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
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
              <span>per halaman</span>
              <span className="text-slate-400 ml-2 hidden md:inline">
                &bull; Menampilkan {Math.min(filteredBuildings.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredBuildings.length)} dari {filteredBuildings.length} gedung
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

        {/* Modal: Tambah / Edit Gedung */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBuilding ? 'Edit Data Gedung Kampus' : 'Tambah Gedung Baru'}
          subtitle="Infrastruktur fisik Institut Teknologi Nusantara"
          icon={<Building2 className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Gedung <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TWR-E"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Resmi Gedung <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gedung BJ Habibie"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Alias / Lokasi Fakultas
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tower A - Fakultas Ilmu Komputer"
                    value={formData.alias}
                    onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Lantai</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={formData.floorsCount}
                      onChange={(e) => setFormData({ ...formData, floorsCount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Ruangan</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.roomsCount}
                      onChange={(e) => setFormData({ ...formData, roomsCount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas (Orang)</label>
                    <input
                      type="number"
                      min={50}
                      step={50}
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Penanggung Jawab (URT) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bambang Irawan"
                      value={formData.picName}
                      onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Telepon Darurat / URT
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0812-3456-7890"
                      value={formData.picPhone}
                      onChange={(e) => setFormData({ ...formData, picPhone: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fungsi & Peruntukan Gedung</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Dekanat FASILKOM, Lab Jaringan Komputer, Ruang Perkuliahan Teori..."
                    value={formData.functionDesc}
                    onChange={(e) => setFormData({ ...formData, functionDesc: e.target.value })}
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
                    {editingBuilding ? 'Simpan Perubahan' : 'Tambah Gedung'}
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
