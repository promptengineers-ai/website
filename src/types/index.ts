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
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
};

export type UserProfile = {
  _id: string;
  userId: string;
  links: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    other?: string;
  };
  background: string;
  seeking: string[] | string; // Array for multi-select, string for backward compatibility
  resumeId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeMetadata = {
  _id: string;
  filename: string;
  contentType: string;
  length: number;
  uploadDate: Date;
  userId: string;
};
