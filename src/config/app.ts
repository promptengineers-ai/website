import {
  FaGithub,
  FaGitlab,
  FaMeetup,
  FaLinkedin,
  FaInstagram,
  FaYoutube,
  FaMedium,
} from "react-icons/fa";

export const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV || "production";
export const WP_SERVER_URL =
  NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://wp.adaptive.biz";
export const MEDIUM_RSS_URL = "https://medium.com/feed/@ryaneggz";

export const socialIcons = [
  {
    Icon: FaGithub,
    tooltip: "ryaneggz",
    key: "github",
    link: "https://github.com/ryaneggz",
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
    tooltip: "Ryan Eggleston",
    key: "linkedin",
    link: "https://www.linkedin.com/in/ryan-eggleston/",
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
