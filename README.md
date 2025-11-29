This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Features

- **User Authentication**: Secure signup and login using JWTs with HTTP-only cookies
- **User Profiles**: Professional profiles with social links (LinkedIn, GitHub, Twitter, Portfolio)
- **Resume Management**: Upload and manage resumes (PDF, DOC, DOCX) with MongoDB GridFS
- **Markdown Support**: Professional background with markdown formatting
- **Career Intentions**: Specify if you're seeking work, hiring, or networking

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)

### Environment Variables

Copy `.example.env` to `.env` and fill in the following variables:

```env
# MongoDB
MONGO_DB_URI=your_mongodb_connection_string

# Auth
NEXTAUTH_SECRET=your_jwt_secret

# Other services (optional)
AIRTABLE_API_KEY=your_airtable_key
BREVO_API_KEY=your_brevo_key
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

To generate a `NEXTAUTH_SECRET`, run:
```bash
openssl rand -base64 32
```

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### User Account Features

1. **Sign Up**: Create a new account at `/signup`
2. **Sign In**: Log in to your account at `/login`
3. **Profile**: View your profile at `/profile`
4. **Edit Profile**: Update your profile at `/profile/edit`

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load custom Google Fonts.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
