/**
 * Mengunduh sebuah elemen HTML langsung sebagai berkas PDF (tanpa dialog cetak browser).
 * Memakai html2pdf (dimuat sekali dari /js/html2pdf.bundle.min.js).
 */
async function loadHtml2Pdf(): Promise<any> {
  const w = window as any;
  if (w.html2pdf) return w.html2pdf;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src="/js/html2pdf.bundle.min.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Gagal memuat pustaka PDF')));
      return;
    }
    const script = document.createElement('script');
    script.src = '/js/html2pdf.bundle.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat pustaka PDF'));
    document.head.appendChild(script);
  });
  return w.html2pdf;
}

export async function downloadElementAsPdf(
  elementId: string,
  filename: string,
  options: { orientation?: 'portrait' | 'landscape'; margin?: [number, number, number, number] } = {},
): Promise<void> {
  const html2pdf = await loadHtml2Pdf();
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Dokumen yang akan diunduh tidak ditemukan.');

  // Elemen sumber berada di luar layar (left negatif). html2canvas ikut menggeser hasilnya sehingga PDF terpotong,
  // jadi salin elemen ke wadah di posisi (0,0) di belakang halaman, ubah ke PDF, lalu buang salinannya.
  const width = Math.ceil(element.getBoundingClientRect().width) || 794;
  const clone = element.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  const holder = document.createElement('div');
  holder.style.cssText = `position:absolute;left:0;top:0;width:${width}px;background:#fff;z-index:-1;pointer-events:none;`;
  holder.appendChild(clone);
  document.body.appendChild(holder);

  try {
    await html2pdf()
      .set({
        margin: options.margin ?? [10, 10, 12, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: width },
        jsPDF: { unit: 'mm', format: 'a4', orientation: options.orientation ?? 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.pdf-keep'] },
      })
      .from(clone)
      .save();
  } finally {
    holder.remove();
  }
}
