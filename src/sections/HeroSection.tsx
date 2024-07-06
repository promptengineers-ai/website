"use client";
import Link from "next/link";
import { socialIcons } from "@/config/app";
import { MdVideoCall } from "react-icons/md";
import { FaMedium } from "react-icons/fa6";
import { HERO_GIF } from "@/config/static";
import { ImProfile } from "react-icons/im";

const HeroSection = () => {
  return (
    <div
      className="relative flex min-h-screen flex-col justify-center bg-cover bg-center bg-no-repeat lg:flex-row lg:items-center"
      style={{ backgroundImage: `url('${HERO_GIF}')` }}
    >
      {/* Overlay */}
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-black bg-opacity-20"></div>

      {/* Social Media Icons - Adjust layout for lg screens and left align on md screens */}

      {/* Hero Content */}
      <div className="z-5 mx-auto max-w-5xl p-3 sm:text-left">
        <div className="z-5 flex items-start justify-start lg:absolute lg:left-2 lg:top-1/2 lg:mt-5 lg:-translate-y-1/2 lg:flex-col lg:items-start lg:justify-start lg:pl-4">
          {socialIcons.map(({ Icon, tooltip, key, link }) => (
            <div
              className="group relative mb-4 mr-3 text-5xl text-white lg:mb-6 lg:mr-0"
              key={key}
            >
              {/* Tooltip text */}
              <div className="hover absolute bottom-full mb-3 hidden w-auto rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:block group-hover:opacity-100">
                {tooltip}
              </div>

              {/* Icon */}
              <Link href={link} target="_blank">
                <Icon
                  style={{
                    filter: "drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.8))",
                  }}
                />
              </Link>
            </div>
          ))}
        </div>

        <h1
          className="fade-in fade-in-1 mb-8 text-7xl font-bold text-white md:text-8xl"
          style={{ filter: "drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.8))" }}
        >
          Time Is Our Most Valuable Resource..
        </h1>
        <p
          className="fade-in fade-in-2 mt-4 text-2xl text-gray-200"
          style={{ filter: "drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.8))" }}
        >
          My goal is to help you get it back by providing simple tools for
          professionals, and best in class API's for builders.
        </p>
        <div className="fade-in fade-in-3 mt-8">
          <Link href="https://calendly.com/adaptivebiz" target="_blank">
            <button className="hover-shadow-defined mr-4 inline-flex items-center rounded-full bg-gray-200/20 px-4 py-2 text-white hover:bg-green-500">
              <span>Free Consult</span>
              <MdVideoCall fontSize="24px" className="ml-1" />
            </button>
          </Link>
          <Link href="/blogs">
            <button className="hover-shadow-defined mr-4 inline-flex items-center rounded-full bg-gray-200/20 px-4 py-2 text-white hover:bg-green-500">
              <span>Blog</span>
              <FaMedium fontSize="20px" className="ml-1" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
