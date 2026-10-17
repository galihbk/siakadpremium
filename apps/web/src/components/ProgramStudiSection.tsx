import { loadFaculties } from '@/lib/faculties';
import { ProgramStudiList, type ProdiCard } from './ProgramStudiList';

/** Program studi aktif diambil dari database (menu Program Studi di portal Super Admin). */
export async function ProgramStudiSection() {
  const { items, failed } = await loadFaculties();
  const cards: ProdiCard[] = items.flatMap((f) =>
    f.prodi.map((p) => ({
      code: p.code,
      name: p.name,
      faculty: f.name,
      level: p.degreeLevel,
      accreditation: p.accreditation,
      degreeTitle: p.degreeTitle,
      students: p.studentsCount,
    })),
  );
  return <ProgramStudiList items={cards} failed={failed} />;
}
