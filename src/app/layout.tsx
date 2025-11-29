import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Montserrat, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Head from "next/head";
import InitialLoadActiveUsers from "@/components/users/InitialLoadActiveUsers";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { GA_ID, NODE_ENV } from "@/config/app";
// import { botScript } from "@/config/bot";

// Primary font - Montserrat for clean, minimal UI elements
const montserrat = Montserrat({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

// Futuristic font for "Be Present" headline
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space",
});

const APP_NAME = "Prompt Engineers AI";
const APP_DEFAULT_TITLE = "Prompt Engineers AI - Dallas Plano AI Community";
const APP_TITLE_TEMPLATE = "%s | Prompt Engineers AI";
const APP_DESCRIPTION =
  "Join 1,500+ developers and tech enthusiasts in Plano, TX exploring ChatGPT, LLMs, and the future of AI. Monthly meetups focused on prompt engineering, machine learning, and AI development.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    locale: "en_US",
    url: "https://promptengineers-ai.github.io/website/",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prompt Engineers AI Community - Dallas Plano AI Meetup",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: ["/images/og-image.png"],
  },
  keywords: [
    "AI",
    "ChatGPT",
    "LLM",
    "Machine Learning",
    "Prompt Engineering",
    "Dallas",
    "Plano",
    "Texas",
    "Meetup",
    "Community",
    "Software Development",
    "Technology",
    "OpenAI",
    "Langchain"
  ],
  authors: [{ name: "Prompt Engineers AI Community" }],
  creator: "Prompt Engineers AI Community",
  publisher: "Prompt Engineers AI Community",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className={`${montserrat.variable} ${spaceGrotesk.variable}`}>
      <Head>
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="theme-color" content="#000" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>
      <body className="font-montserrat">
        <AuthProvider>{children}</AuthProvider>
      </body>
      {NODE_ENV === "production" && GA_ID && (
        <>
          <GoogleAnalytics gaId={GA_ID} />
          <InitialLoadActiveUsers />
        </>
      )}
    </html>
  );
}
