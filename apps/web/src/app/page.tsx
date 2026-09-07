
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { SambutanRektor } from '@/components/SambutanRektor';
import { KeunggulanSection } from '@/components/KeunggulanSection';
import { FakultasSection } from '@/components/FakultasSection';
import { ProgramStudiSection } from '@/components/ProgramStudiSection';
import { BeritaSection } from '@/components/BeritaSection';
import { AgendaSection } from '@/components/AgendaSection';
import { StatistikSection } from '@/components/StatistikSection';
import { TestimoniSection } from '@/components/TestimoniSection';
import { CtaSection } from '@/components/CtaSection';
import { Footer } from '@/components/Footer';
import { Megaphone } from 'lucide-react';

async function getLandingPageData() {
  try {
    // Log real visit to analytics
    fetch('http://localhost:3001/api/v1/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/', referer: 'Google' }),
    }).catch(() => {});

    const res = await fetch('http://localhost:3001/api/v1/landing-page', {
      next: { revalidate: 1 },
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {
    // Graceful fallback if API is not yet loaded
  }
  return null;
}

export default async function HomePage() {
  const data = await getLandingPageData();

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Sticky Navbar */}
      <Navbar />

      {/* Announcement Banner if active */}
      {data?.announcementActive && (
        <div className="bg-gradient-to-r from-amber-500 via-[#D4A017] to-amber-600 text-slate-950 py-2.5 px-4 text-xs font-medium border-b border-amber-600/40 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
            <span className="inline-flex items-center gap-1 font-extrabold bg-slate-950 text-[#D4A017] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
              <Megaphone className="w-3 h-3" />
              {data.announcementBadge || 'PENGUMUMAN'}
            </span>
            <span className="font-semibold">{data.announcementText}</span>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {/* 2. Hero Section */}
        <HeroSection
          badge={data?.heroBadge}
          title={data?.heroTitle}
          subtitle={data?.heroSubtitle}
          ctaText={data?.heroCtaText}
          ctaLink={data?.heroCtaLink}
        />

        {/* 3. Sambutan Rektor */}
        <SambutanRektor
          rectorName={data?.rectorName}
          rectorTitle={data?.rectorTitle}
          rectorSpeech={data?.rectorSpeech}
          rectorImageUrl={data?.rectorImageUrl}
        />

        {/* 4. Keunggulan Kampus */}
        <KeunggulanSection />

        {/* 5. Fakultas */}
        <FakultasSection />

        {/* 6. Program Studi */}
        <ProgramStudiSection />

        {/* 7. Berita Terbaru */}
        <BeritaSection />

        {/* 8. Agenda Kampus */}
        <AgendaSection />

        {/* 9. Statistik */}
        <StatistikSection />

        {/* 10. Testimoni Alumni */}
        <TestimoniSection />

        {/* 11. CTA PMB */}
        <CtaSection />
      </main>

      {/* 12. Footer */}
      <Footer />
    </div>
  );
}
