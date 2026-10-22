import React from 'react';
import { parseLetterBody } from '@/lib/letterText';

/**
 * Isi surat: baris identitas "Label: nilai" (Nama, NIM, Program Studi, Fakultas) ditampilkan sebagai tabel dengan titik dua
 * sejajar; baris lain paragraf biasa. Surat lama (satu paragraf) ditata ulang otomatis; lihat lib/letterText.
 */
export function LetterBody({ text, campusName }: { text: string; campusName?: string }) {
  const blocks = parseLetterBody(text, campusName);
  return (
    <div className="text-justify">
      {blocks.map((b, i) =>
        b.type === 'space' ? (
          <div key={i} className="h-2" />
        ) : b.type === 'p' ? (
          <p key={i}>{b.text}</p>
        ) : (
          <table key={i} className="ml-4 my-1 text-left">
            <tbody>
              {b.rows.map(([k, v]) => (
                <tr key={k}>
                  <td className="pr-3 align-top whitespace-nowrap">{k}</td>
                  <td className="pr-2 align-top">:</td>
                  <td className="align-top font-semibold">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      )}
    </div>
  );
}
