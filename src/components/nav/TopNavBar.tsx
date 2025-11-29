"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose, MdMenu } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { FiUser, FiLogOut } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

const TopNavbar = () => {
  const { user, logout, status } = useAuth();
  const router = useRouter();
  const [showSolidBackground, setShowSolidBackground] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      setShowSolidBackground(currentScroll > 50);
      
      // Detect which section is currently in view
      const sections = ["contact"];
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

  const handleSignOut = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Define menu items in one place for consistency
  const menuItems = [
    { href: "/", label: "Home" },
    // { href: "/#about", label: "About" },
    // { href: "/blog", label: "Blog" }
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ease-in-out ${
          showSolidBackground 
            ? "bg-black/90 backdrop-blur-lg shadow-lg shadow-black/20 py-2" 
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
              <a href="/" className="flex items-center ml-2 gap-3">
                <span className="text-2xl">🤖</span>
                <span className="text-xl font-bold tracking-tight text-white hover:text-gray-300 transition-colors duration-200">
                  Prompt Engineers <span className="text-blue-400">AI</span>
                </span>
              </a>
            </motion.div>
            
            {/* Right side - GitHub link and Auth */}
            <div className="flex items-center gap-4">
              {/* <a
                href="https://github.com/promptengineers-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="GitHub"
              >
                <FaGithub className="text-xl" />
              </a> */}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 rounded-full bg-gray-800/70 px-3 py-2 text-white hover:bg-gray-700/70 transition-colors duration-200"
                  >
                    <FiUser className="text-lg" />
                    <span className="hidden sm:inline text-sm">{user.name}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          My Profile
                        </Link>
                        <Link
                          href="/profile/edit"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Edit Profile
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="flex items-center gap-2">
                            <FiLogOut />
                            Sign Out
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-full bg-transparent border border-white/30 text-white px-4 py-2 text-sm font-medium hover:bg-white/10 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            {/* <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleDrawer} 
              className="flex items-center justify-center rounded-full bg-gray-800/70 p-2 text-white hover:bg-gray-700/70 transition-colors duration-200 sm:hidden"
              aria-label="Open menu"
            >
              <MdMenu className="h-6 w-6" />
            </motion.button> */}
            
            {/* Desktop menu */}
            {/* <div className="hidden sm:flex items-center space-x-1">
              
              <motion.a
                href="/#contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ml-2 rounded-full bg-white text-black px-5 py-2 text-sm font-montserrat tracking-wide font-medium shadow-lg shadow-white/10 hover:bg-gray-200 transition-all duration-200"
              >
                Join Beta
              </motion.a>
            </div> */}
          </div>
        </div>
      </motion.nav>
      
    </>
  );
};

export default TopNavbar;
