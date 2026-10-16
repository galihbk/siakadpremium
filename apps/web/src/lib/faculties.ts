import { getApiBaseUrl } from './api';

export interface PublicProdi {
  id: string;
  code: string;
  name: string;
  degreeLevel: string;
  degreeTitle: string | null;
  accreditation: string;
  accreditationAgency: string | null;
  skAkreditasi: string | null;
  diktiCode: string | null;
  vision: string | null;
  mission: string | null;
  headOfProgram: string | null;
  studentsCount: number;
  lecturersCount: number;
  status: string;
}

export interface PublicFaculty {
  id: string;
  code: string;
  name: string;
  description: string | null;
  building: string | null;
  establishedYear: number | null;
  accreditation: string | null;
  deanName: string | null;
  vision: string | null;
  mission: string | null;
  prodi: PublicProdi[];
}

async function getList<T>(path: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/** Fakultas + program studi aktifnya, dari database. `failed` bila API tidak terjangkau. */
export async function loadFaculties(): Promise<{ items: PublicFaculty[]; failed: boolean }> {
  const [faculties, prodis] = await Promise.all([getList<any>('/faculties'), getList<any>('/study-programs')]);
  if (!faculties) return { items: [], failed: true };
  const items = faculties
    .map(
      (f): PublicFaculty => ({
        id: f.id,
        code: f.code,
        name: f.name,
        description: f.description ?? null,
        building: f.building ?? null,
        establishedYear: f.establishedYear ?? null,
        accreditation: f.accreditation ?? null,
        deanName: f.deanName ?? null,
        vision: f.vision ?? null,
        mission: f.mission ?? null,
        prodi: (prodis ?? [])
          .filter((p: any) => p.facultyId === f.id && p.status === 'Aktif')
          .map(
            (p: any): PublicProdi => ({
              id: p.id,
              code: p.code,
              name: p.name,
              degreeLevel: p.degreeLevel,
              degreeTitle: p.degreeTitle ?? null,
              accreditation: p.accreditation,
              accreditationAgency: p.accreditationAgency ?? null,
              skAkreditasi: p.skAkreditasi ?? null,
              diktiCode: p.diktiCode ?? null,
              vision: p.vision ?? null,
              mission: p.mission ?? null,
              headOfProgram: p.headOfProgram ?? null,
              studentsCount: p.studentsCount ?? 0,
              lecturersCount: p.lecturersCount ?? 0,
              status: p.status,
            }),
          )
          .sort((a: PublicProdi, b: PublicProdi) => a.name.localeCompare(b.name)),
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return { items, failed: false };
}

export interface PublicCourse {
  id: string;
  code: string;
  name: string;
  semester: number;
  sks: number;
  type: string;
  curriculumName: string | null;
}

/** Satu program studi (berdasarkan kode) beserta fakultasnya dan katalog mata kuliahnya. */
export async function loadProdi(code: string) {
  const { items } = await loadFaculties();
  const wanted = decodeURIComponent(code).toLowerCase();
  for (const faculty of items) {
    const prodi = faculty.prodi.find((p) => p.code.toLowerCase() === wanted);
    if (prodi) {
      const courses = (await getList<any>(`/academic/courses?studyProgramId=${encodeURIComponent(prodi.id)}`)) ?? [];
      const list: PublicCourse[] = courses
        .filter((c: any) => c.status === 'Aktif')
        .map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          semester: c.semester,
          sks: c.sks ?? c.totalSks ?? 0,
          type: c.type,
          curriculumName: c.curriculumName ?? null,
        }));
      return { faculty, prodi, courses: list };
    }
  }
  return null;
}
