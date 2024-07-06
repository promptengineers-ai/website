"use client";

import { FaGithub, FaLinkedin } from "react-icons/fa";

const AboutSection = () => {
  return (
    <div id="about" className="bg-black py-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="relative flex justify-center">
            <div
              className="absolute rounded-lg bg-indigo-700 opacity-40"
              style={{
                width: "79%",
                height: "70%",
                bottom: "0%",
                right: "10.5%",
                opacity: 0.6,
                zIndex: 0,
                borderRadius: "10px 10px 10px 10px",
              }}
            ></div>
            <img
              src="/images/ryan_egg.png"
              alt="Founder"
              className="relative z-10 rounded-[0px_0px_10px_10px]"
              style={{
                filter: "drop-shadow(0px 2px 5px black)",
                // scale: 0.95,
                zIndex: 1,
              }}
            />
            <div className="absolute bottom-[-30px] z-20 rounded bg-white p-2 shadow-md md:bottom-4 md:right-4">
              <div className="flex items-center">
                <p className="md:text-md text-sm font-bold text-black">
                  Ryan Eggleston
                </p>
                <a
                  href="https://www.linkedin.com/in/ryan-eggleston" // Replace with the actual LinkedIn URL
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-700"
                >
                  <FaLinkedin size={20} />
                </a>
                <a
                  href="https://github.com/ryaneggz" // Replace with the actual GitHub URL
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-black"
                >
                  <FaGithub size={20} />
                </a>
              </div>
              <p className="text-xs text-gray-700 md:text-sm">
                Founder & Core Developer
              </p>
            </div>
          </div>
          <div className="mt-10 md:mt-20">
            <h2 className="mb-8 text-5xl font-bold text-white md:text-6xl">
              My Promise...
            </h2>
            <p className="text-xl text-gray-300">
              To listen to your feedback and bring you the features you want
              most. I will be implementing a suggestion form so that you can
              tell me what you&apos;d like to see and the community will vote on
              the features they want to see implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
