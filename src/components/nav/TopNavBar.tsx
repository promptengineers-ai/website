"use client";

import React, { useState, useEffect } from "react";
import { FaMedium } from "react-icons/fa6";
import {
  MdHome,
  MdWork,
  MdDescription,
  MdCreate,
  MdBook,
  MdBuild,
  MdLayers,
  MdFolderSpecial,
  MdEmail,
  MdContacts,
} from "react-icons/md";

const TopNavbar = () => {
  const [showSolidBackground, setShowSolidBackground] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      setShowSolidBackground(currentScroll > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const solidStyle = {
    background: "black",
    backdropFilter: "blur(10px)",
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <nav
        style={showSolidBackground ? solidStyle : {}}
        className="fixed left-0 top-0 z-50 w-full transition-all duration-300 ease-in-out"
      >
        <div className="px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <img
                src="/pe-logo.png"
                alt="Logo"
                className="mr-1 mt-1 h-6 w-6 md:h-8 md:w-8"
              />
              <a
                href="/"
                className="hover-shadow-defined flex items-center px-1 text-xl text-white hover:text-green-400 md:text-3xl"
              >
                <span>promptengineers.ai</span>
              </a>
            </div>
            {/* Hamburger Menu Button, visible on smaller screens */}
            <button onClick={toggleDrawer} className="text-white sm:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
            <div className="hidden space-x-4 text-white sm:flex">
              <a href="/" className="hover:text-green-400">
                Home
              </a>
              {/* <a href="/resume.pdf" className="hover:text-green-400">
                Resume
              </a> */}
              <a href="/#about" className="hover:text-green-400">
                About
              </a>
              <a href="/#features" className="hover:text-green-400">
                Features
              </a>
              <a href="/#projects" className="hover:text-green-400">
                Projects
              </a>
              <a href="/#contact" className="hover:text-green-400">
                Waitlist
              </a>
            </div>
          </div>
        </div>
      </nav>
      {/* Drawer Menu for mobile */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-64 transform bg-black p-4 text-gray-100 shadow-md transition-transform ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <button
          onClick={toggleDrawer}
          className="mb-4 rounded px-2 py-2 hover:bg-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <nav>
          <a
            href="/"
            className="flex items-center p-2 text-sm hover:bg-gray-700"
            onClick={closeDrawer}
          >
            <MdHome className="mr-1" fontSize={"20px"} /> Home
          </a>
          {/* <a
            href="/resume.pdf"
            className="flex items-center p-2 text-sm hover:bg-gray-700"
            onClick={closeDrawer}
          >
            <MdDescription className="mr-2" fontSize={"20px"} /> Resume
          </a> */}
          <a
            href="/blogs"
            className="flex items-center p-2 text-sm hover:bg-gray-700"
            onClick={closeDrawer}
          >
            <FaMedium className="mr-2" fontSize={"20px"} /> Blog
          </a>
          <a
            href="/#features"
            className="flex items-center p-2 text-sm hover:bg-gray-700"
            onClick={closeDrawer}
          >
            <MdBuild className="mr-2" fontSize={"20px"} /> Features
          </a>
          <a
            href="/#projects"
            className="flex items-center p-2 text-sm hover:bg-gray-700"
            onClick={closeDrawer}
          >
            <MdLayers className="mr-2" fontSize={"20px"} /> Projects
          </a>
          <a
            href="/#contact"
            className="flex items-center p-2 text-sm hover:bg-gray-700"
            onClick={closeDrawer}
          >
            <MdEmail className="mr-2" fontSize={"20px"} /> Waitlist
          </a>
        </nav>
      </div>
    </>
  );
};

export default TopNavbar;
