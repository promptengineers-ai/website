"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaQuestion, FaMedium } from "react-icons/fa6";
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
  MdCode,
  MdClose,
  MdMenu,
} from "react-icons/md";
import Image from "next/image";

const TopNavbar = () => {
  const [showSolidBackground, setShowSolidBackground] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      setShowSolidBackground(currentScroll > 50);
      
      // Optional: detect which section is currently in view
      const sections = ["contact", "roadmap"];
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Define menu items in one place for consistency
  const menuItems = [
    { href: "/", label: "Home", icon: <MdHome className="text-xl" /> },
    { href: "/#roadmap", label: "Roadmap", icon: <MdLayers className="text-xl" /> },
    // { href: "/#contact", label: "Waitlist", icon: <MdEmail className="text-xl" /> },
    { href: "https://demo.promptengineers.ai/chat", label: "Demo", icon: <MdCode className="text-xl" />, target: "_blank" },
    { href: "/blogs", label: "Blog", icon: <FaMedium className="text-xl" /> }
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ease-in-out ${
          showSolidBackground 
            ? "bg-gray-900/90 backdrop-blur-lg shadow-lg shadow-black/20 py-2" 
            : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center" 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Image
                src="/pe-logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="mr-2 md:h-9 md:w-9"
              />
              <a
                href="/"
                className="flex items-center text-xl font-bold text-white hover:text-indigo-400 transition-colors duration-200 md:text-2xl"
              >
                <span>promptengineers.ai</span>
              </a>
            </motion.div>
            
            {/* Mobile menu button */}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleDrawer} 
              className="flex items-center justify-center rounded-full bg-gray-800/70 p-2 text-white hover:bg-indigo-600/70 transition-colors duration-200 sm:hidden"
              aria-label="Open menu"
            >
              <MdMenu className="h-6 w-6" />
            </motion.button>
            
            {/* Desktop menu */}
            <div className="hidden sm:flex items-center space-x-1">
              {menuItems.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  target={item.target}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 
                    ${activeSection === item.label.toLowerCase() 
                      ? "text-white bg-indigo-600/30" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.label}
                  {activeSection === item.label.toLowerCase() && (
                    <motion.span
                      layoutId="navIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.a>
              ))}
              
              <motion.a
                href="/#contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ml-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-700 hover:to-blue-600 transition-all duration-200"
              >
                Join Waitlist
              </motion.a>
            </div>
          </div>
        </div>
      </motion.nav>
      
      {/* Mobile drawer menu */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closeDrawer}
            />
            
            {/* Drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-72 bg-gray-900/95 shadow-xl shadow-black/30 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-gray-800 p-5">
                <div className="flex items-center">
                  <svg className="h-7 w-7 mr-2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Example: Zen Circle (Ensō) */}
                    <path 
                      d="M20 5C13.925 5 9 9.925 9 16C9 22.075 13.925 32 20 32C26.075 32 31 22.075 31 16C31 9.925 26.075 5 20 5Z" 
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{
                        stroke: "url(#gradient)",
                        fill: "none"
                      }}
                    />
                    {/* Break in the circle representing mindfulness and journey */}
                    <path 
                      d="M20 5C18 5 16.5 5.5 15 6.5" 
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{
                        stroke: "url(#gradient)",
                        fill: "none"
                      }}
                    />
                    {/* Define gradient */}
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" /> {/* indigo-400 */}
                        <stop offset="100%" stopColor="#a855f7" /> {/* purple-500 */}
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-lg font-bold text-white">Be Present</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeDrawer}
                  className="rounded-full bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                >
                  <MdClose className="h-5 w-5" />
                </motion.button>
              </div>
              
              <div className="p-5">
                <nav className="flex flex-col space-y-2">
                  {menuItems.map((item, index) => (
                    <motion.a
                      key={index}
                      href={item.href}
                      target={item.target}
                      className="flex items-center rounded-lg p-3 text-gray-300 hover:bg-indigo-600/20 hover:text-white transition-colors duration-200"
                      onClick={closeDrawer}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span className="mr-3 text-indigo-400">{item.icon}</span>
                      {item.label}
                    </motion.a>
                  ))}
                </nav>
                
                <div className="mt-8 border-t border-gray-800 pt-6">
                  <motion.a
                    href="/#contact"
                    onClick={closeDrawer}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 py-3 font-medium text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-700 hover:to-blue-600 transition-all duration-200"
                  >
                    Join Waitlist
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopNavbar;
