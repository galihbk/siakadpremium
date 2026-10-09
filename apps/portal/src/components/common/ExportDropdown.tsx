'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

interface ExportDropdownProps<T> {
  data: T[];
  /** Kolom untuk Excel -- boleh selengkap mungkin, Excel aman menampung banyak kolom. */
  columns: ExportColumn<T>[];
  /** Kolom khusus untuk PDF (opsional). Kalau tidak diisi, pakai `columns` juga -- tapi
   *  untuk dataset dengan banyak kolom (biodata lengkap dsb.), sebaiknya diisi dengan subset
   *  yang lebih ringkas supaya PDF-nya tetap terbaca (PDF tidak sefleksibel Excel untuk kolom banyak). */
  pdfColumns?: ExportColumn<T>[];
  filename: string;
  title?: string;
  className?: string;
}

export function ExportDropdown<T>({ data, columns, pdfColumns, filename, title, className }: ExportDropdownProps<T>) {
  const effectivePdfColumns = pdfColumns ?? columns;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const handleExportExcel = async () => {
    setOpen(false);
    const XLSX = await import('xlsx');
    const rows = data.map((row) => {
      const obj: Record<string, string | number> = {};
      for (const col of columns) obj[col.header] = col.accessor(row);
      return obj;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleExportPdf = async () => {
    setOpen(false);
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: effectivePdfColumns.length > 5 ? 'landscape' : 'portrait' });

    if (title) {
      doc.setFontSize(12);
      doc.text(title, 14, 14);
    }

    autoTable(doc, {
      startY: title ? 20 : 12,
      head: [effectivePdfColumns.map((c) => c.header)],
      body: data.map((row) => effectivePdfColumns.map((c) => String(c.accessor(row)))),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save(`${filename}.pdf`);
  };

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={data.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        Ekspor
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-20">
          <button
            onClick={handleExportExcel}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Unduh PDF (.pdf)</span>
          </button>
        </div>
      )}
    </div>
  );
}
