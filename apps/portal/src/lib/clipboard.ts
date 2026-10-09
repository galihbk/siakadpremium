// navigator.clipboard hanya tersedia di secure context (https atau localhost) -- di domain
// http biasa (mis. lewat proxy Caddy tanpa TLS) properti ini undefined dan langsung crash
// kalau dipanggil begitu saja. Fallback ke textarea tersembunyi + execCommand untuk kasus itu.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}
