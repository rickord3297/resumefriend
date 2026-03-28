import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export interface ProfileResume {
  id: string;
  name: string;
  url: string; // blob path or stored file ref
  isPrimary: boolean;
  uploadedAt: string; // ISO
}

export interface CareerDNA {
  targetJobTitles: string[];
  salaryMin?: number;
  salaryMax?: number;
  yearsExperience?: number;
}

export interface Profile {
  resumes: ProfileResume[];
  careerDNA: CareerDNA;
  linkedInConnected: boolean;
  lastUpdated: string; // ISO
}

const DATA_DIR = path.join(process.cwd(), "data");
const PROFILE_FILE = path.join(process.cwd(), "data", "profile.json");

const defaultProfile: Profile = {
  resumes: [],
  careerDNA: { targetJobTitles: [] },
  linkedInConnected: false,
  lastUpdated: new Date().toISOString(),
};

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function getProfile(): Promise<Profile> {
  try {
    const raw = await readFile(PROFILE_FILE, "utf-8");
    const p = JSON.parse(raw) as Profile;
    return {
      ...defaultProfile,
      ...p,
      resumes: p.resumes ?? [],
      careerDNA: p.careerDNA ?? defaultProfile.careerDNA,
    };
  } catch {
    return { ...defaultProfile };
  }
}

export async function setProfile(profile: Profile): Promise<void> {
  await ensureDir();
  profile.lastUpdated = new Date().toISOString();
  await writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2), "utf-8");
}

export async function addResume(name: string, url: string): Promise<ProfileResume> {
  const profile = await getProfile();
  const isPrimary = profile.resumes.length === 0;
  const id = `res_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const resume: ProfileResume = {
    id,
    name,
    url,
    isPrimary,
    uploadedAt: new Date().toISOString(),
  };
  profile.resumes.push(resume);
  await setProfile(profile);
  return resume;
}

export async function setPrimaryResume(id: string): Promise<void> {
  const profile = await getProfile();
  profile.resumes.forEach((r) => {
    r.isPrimary = r.id === id;
  });
  await setProfile(profile);
}

export async function updateCareerDNA(dna: Partial<CareerDNA>): Promise<void> {
  const profile = await getProfile();
  profile.careerDNA = { ...profile.careerDNA, ...dna };
  await setProfile(profile);
}

export async function setLinkedInConnected(connected: boolean): Promise<void> {
  const profile = await getProfile();
  profile.linkedInConnected = connected;
  await setProfile(profile);
}

/** Add sample resumes (demo_*) for screenshots; keeps real uploads, replaces prior demo rows. */
export async function seedDemoResumes(): Promise<Profile> {
  const profile = await getProfile();
  const kept = profile.resumes.filter((r) => !r.id.startsWith("demo_"));
  const hadPrimary = kept.some((r) => r.isPrimary);
  const t = new Date().toISOString();
  const demos: ProfileResume[] = [
    {
      id: "demo_res_pm",
      name: "Alex Rivera — Product Manager",
      url: "/demo-resumes/alex-rivera-pm.html",
      isPrimary: false,
      uploadedAt: t,
    },
    {
      id: "demo_res_eng",
      name: "Jordan Chen — Senior Software Engineer",
      url: "/demo-resumes/jordan-chen-engineer.html",
      isPrimary: false,
      uploadedAt: t,
    },
    {
      id: "demo_res_em",
      name: "Sam Okonkwo — Engineering Manager",
      url: "/demo-resumes/sam-okonkwo-em.html",
      isPrimary: false,
      uploadedAt: t,
    },
  ];
  if (!hadPrimary) {
    if (kept.length === 0) demos[0].isPrimary = true;
    else kept[0].isPrimary = true;
  }
  profile.resumes = [...kept, ...demos];
  profile.careerDNA = {
    ...profile.careerDNA,
    targetJobTitles: profile.careerDNA.targetJobTitles?.length
      ? profile.careerDNA.targetJobTitles
      : ["Product Manager", "Senior Engineer", "Engineering Manager"],
    salaryMin: profile.careerDNA.salaryMin ?? 160000,
    salaryMax: profile.careerDNA.salaryMax ?? 220000,
    yearsExperience: profile.careerDNA.yearsExperience ?? 8,
  };
  await setProfile(profile);
  return profile;
}
