import {
  FaGithub,
  FaGitlab,
  FaMeetup,
  FaLinkedin,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";

export const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV || "production";
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const MEDIUM_RSS_URL = "https://medium.com/feed/@ryaneggz";


// Social Config
export const socialIcons = [
  {
    Icon: FaGithub,
    tooltip: "promptengineers-ai",
    key: "github",
    link: "https://github.com/promptengineers-ai",
  },
  {
    Icon: FaGitlab,
    tooltip: "kre8mymedia",
    key: "gitlab",
    link: "https://gitlab.com/kre8mymedia",
  },
  {
    Icon: FaMeetup,
    tooltip: "Plano Prompt Engineers",
    key: "meetup",
    link: "https://www.meetup.com/Plano-Prompt-Engineers/",
  },
  {
    Icon: FaLinkedin,
    tooltip: "Prompt Engineers AI",
    key: "linkedin",
    link: "https://www.linkedin.com/company/promptengineers-ai",
  },
  {
    Icon: FaInstagram,
    tooltip: "@promptengineers.ai",
    key: "instagram",
    link: "https://www.instagram.com/promptengineers.ai/",
  },
  {
    Icon: FaYoutube,
    tooltip: "@promptengineers",
    key: "youtube",
    link: "https://www.youtube.com/@promptengineersai",
  },
  // {
  //   Icon: FaMedium,
  //   tooltip: "@promptengineers",
  //   key: "youtube",
  //   link: "https://www.youtube.com/channel/promptengineers",
  // },
];
