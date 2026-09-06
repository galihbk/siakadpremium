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

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Sticky Navbar */}
      <Navbar />

      <main className="flex-grow">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Sambutan Rektor */}
        <SambutanRektor />

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
