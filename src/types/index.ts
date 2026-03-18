export type Blog = {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  summary: string;
  slug: string;
};

export type Contact = {
  Name?: string;
  Email: string;
  Phone?: string;
  Message?: string;
  Referrer?: string;
};

// User Authentication Types
export type User = {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export type UserProfile = {
  _id: string;
  userId: string;
  links: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    meetup?: string;
    other?: string;
  };
  background: string;
  seeking: string[] | string; // Array for multi-select, string for backward compatibility
  resumeId?: string;
  isPublic?: boolean;
  avatarUrl?: string;
  badges: string[];
  skillBackground?: string;
  aiExperience?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Hackathon Types
export const HACKATHON_ROLES = [
  "Product Manager",
  "UI/UX Designer",
  "Prompt/AI Engineer",
  "Backend Engineer",
  "Frontend Developer",
  "Flex",
] as const;

export type HackathonRole = (typeof HACKATHON_ROLES)[number];

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  "Product Manager":
    "Owns the vision, defines the problem, prioritizes features, and keeps the team aligned on what to build and why.",
  "UI/UX Designer":
    "Designs the user experience and interface — wireframes, mockups, and prototypes that make the product intuitive and polished.",
  "Prompt/AI Engineer":
    "Crafts prompts, fine-tunes AI model interactions, and integrates LLMs/APIs to power the product's intelligent features.",
  "Backend Engineer":
    "Builds the server, APIs, and database layer — handles data flow, auth, and business logic behind the scenes.",
  "Frontend Developer":
    "Brings the UI to life in the browser — implements designs, handles user interactions, and connects to backend APIs.",
  Flex: "Versatile team player who fills gaps wherever needed — can assist with any role depending on team needs.",
};

export const SKILL_BACKGROUNDS = [
  "Frontend development",
  "Backend development",
  "Data / Machine Learning / AI",
  "Design / UX",
  "Product Management",
  "DevOps / Infrastructure",
  "Non-technical (learning AI tools)",
] as const;

export type SkillBackground = (typeof SKILL_BACKGROUNDS)[number];

export const AI_EXPERIENCE_LEVELS = [
  "Beginner (played with APIs / tools)",
  "Intermediate (built small projects)",
  "Advanced (production experience)",
] as const;

export type AiExperience = (typeof AI_EXPERIENCE_LEVELS)[number];

export type HackathonStatus = "draft" | "registration" | "active" | "completed";

export const INVOLVEMENT_TYPES = [
  "participant",
  "volunteer",
  "mentor",
] as const;
export type HackathonInvolvement = (typeof INVOLVEMENT_TYPES)[number];

export type Hackathon = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  maxTeamSize: number;
  roles: HackathonRole[];
  requiredRoles: HackathonRole[];
  registrationDeadline?: Date;
  teamLockDate?: Date;
  status: HackathonStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type HackathonTeamSlot = {
  role: HackathonRole;
  userId?: string;
  required: boolean;
};

export type HackathonTeam = {
  _id: string;
  hackathonId: string;
  name: string;
  description?: string;
  order: number;
  slots: HackathonTeamSlot[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type HackathonRegistration = {
  _id: string;
  hackathonId: string;
  userId: string;
  involvement: HackathonInvolvement;
  rolePreference?: HackathonRole;
  registeredAt: Date;
};

export type ResumeMetadata = {
  _id: string;
  filename: string;
  contentType: string;
  length: number;
  uploadDate: Date;
  userId: string;
};
