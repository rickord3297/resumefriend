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
