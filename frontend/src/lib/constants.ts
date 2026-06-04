export const APP_NAME = "LITHY AI";
export const APP_DESCRIPTION = "AI-Powered Resume Builder — Create professional resumes, cover letters, and optimize your LinkedIn profile with AI.";
export const APP_URL = "https://lithyai.com";

export const PLANS = {
  FREE: { name: "Free", priceEgp: 0, priceUsd: 0 },
  PRO: { name: "Pro", priceEgp: 75, priceUsd: 2 },
  PREMIUM: { name: "Premium", priceEgp: 150, priceUsd: 5 },
} as const;

export const USAGE_LIMITS = {
  FREE: { aiGenerations: 0, atsScans: 0, jobMatches: 0, maxResumes: 3 },
  PRO: { aiGenerations: 10, atsScans: 5, jobMatches: 5, maxResumes: 10 },
  PREMIUM: { aiGenerations: Infinity, atsScans: Infinity, jobMatches: Infinity, maxResumes: Infinity },
} as const;

export const RESUME_SECTIONS = [
  { id: "contact", label: "Contact", icon: "User" },
  { id: "summary", label: "Professional Summary", icon: "FileText" },
  { id: "experience", label: "Experience", icon: "Briefcase" },
  { id: "education", label: "Education", icon: "GraduationCap" },
  { id: "skills", label: "Skills", icon: "Wrench" },
  { id: "certifications", label: "Certifications", icon: "Award" },
  { id: "languages", label: "Languages", icon: "Globe" },
  { id: "projects", label: "Projects", icon: "Folder" },
  { id: "references", label: "References", icon: "Users" },
  { id: "publications", label: "Publications", icon: "BookOpen" },
  { id: "volunteer", label: "Volunteer", icon: "Heart" },
  { id: "awards", label: "Awards", icon: "Trophy" },
  { id: "patents", label: "Patents", icon: "Lightbulb" },
  { id: "military", label: "Military Service", icon: "Shield" },
  { id: "hobbies", label: "Hobbies", icon: "Music" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "executive", label: "Executive Level" },
] as const;

export const RESUME_TEMPLATES = [
  { id: "default", name: "Classic", premium: false, description: "A timeless, clean layout trusted by professionals worldwide.", features: ["Standard sections", "ATS-optimized", "Print-friendly"] },
  { id: "modern", name: "Modern", premium: false, description: "Clean contemporary design with a sidebar for skills and contact.", features: ["Sidebar layout", "Skill bars", "Color accents"] },
  { id: "minimal", name: "Minimal", premium: false, description: "Maximum white space, minimum distractions. Let your content shine.", features: ["Minimalist design", "Large text", "No distractions"] },
  { id: "professional", name: "Professional", premium: true, description: "Executive-grade template with refined typography and layout.", features: ["Executive styling", "Refined typography", "Premium paper feel"] },
  { id: "creative", name: "Creative", premium: true, description: "Stand out with a unique layout designed for creative industries.", features: ["Unique layout", "Design elements", "Portfolio-ready"] },
] as const;

export const AI_TONES = [
  { value: "professional", label: "Professional" },
  { value: "creative", label: "Creative" },
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "confident", label: "Confident" },
] as const;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "/api/v1" : "http://localhost:4000/api/v1");

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
