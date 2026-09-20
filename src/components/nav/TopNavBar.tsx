"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MdClose, MdMenu } from "react-icons/md";
import { FiUser, FiLogOut } from "react-icons/fi";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { CHAPTERS } from "@/config/chapters";

const MOBILE_MENU_ID = "top-nav-mobile-menu";

const TopNavbar = () => {
  const { user, logout, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showSolidBackground, setShowSolidBackground] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      setShowSolidBackground(currentScroll > 50);

      // Detect which section is currently in view
      const sections = ["contact"];
      sections.forEach((section) => {
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

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && isDrawerOpen) {
      event.preventDefault();
      closeDrawer();
      menuButtonRef.current?.focus();
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      setIsDrawerOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
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
            ? "bg-black/90 py-2 shadow-lg shadow-black/20 backdrop-blur-lg"
            : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4" onKeyDown={handleMenuKeyDown}>
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <a href="/" className="flex items-center gap-3 md:ml-2">
                <span className="whitespace-nowrap text-base font-bold tracking-tight text-white transition-colors duration-200 hover:text-gray-300 md:text-lg">
                  Prompt Engineers <span className="text-blue-400">AI</span>
                </span>
              </a>
            </motion.div>

            {/* Right side - public links and Auth */}
            <div className="hidden items-center gap-4 md:flex">
              <Link
                href="/members"
                className="text-sm font-medium text-gray-300 transition-colors duration-200 hover:text-white"
              >
                Members
              </Link>
              {CHAPTERS.map((chapter) => (
                <Link
                  key={chapter.slug}
                  href={`/chapters/${chapter.slug}`}
                  className="text-sm font-medium text-gray-300 transition-colors duration-200 hover:text-white"
                >
                  {chapter.name}
                </Link>
              ))}

              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                    className="flex items-center gap-2 rounded-full bg-gray-800/70 px-3 py-2 text-white transition-colors duration-200 hover:bg-gray-700/70"
                  >
                    <FiUser className="text-lg" aria-hidden="true" />
                    <span className="text-sm">{user.name}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
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
                        <Link
                          href="/members"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Members
                        </Link>
                        <Link
                          href="/hackathon"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Hackathon
                        </Link>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="flex items-center gap-2">
                            <FiLogOut aria-hidden="true" />
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
                    href={`/login?from=${encodeURIComponent(pathname)}`}
                    className="rounded-full border border-white/30 bg-transparent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/signup?from=${encodeURIComponent(pathname)}`}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all duration-200 hover:bg-gray-200"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={toggleDrawer}
              aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={isDrawerOpen}
              aria-controls={MOBILE_MENU_ID}
              className="flex items-center justify-center rounded-full bg-gray-800/70 p-2 text-white transition-colors duration-200 hover:bg-gray-700/70 md:hidden"
            >
              {isDrawerOpen ? (
                <MdClose className="h-6 w-6" aria-hidden="true" />
              ) : (
                <MdMenu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {isDrawerOpen && (
            <div
              id={MOBILE_MENU_ID}
              className="mt-3 flex flex-col gap-1 rounded-2xl bg-black/90 p-2 shadow-lg shadow-black/20 backdrop-blur-lg md:hidden"
            >
              <Link
                href="/members"
                onClick={closeDrawer}
                className="rounded-xl px-4 py-3 text-base font-medium text-gray-200 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Members
              </Link>
              {CHAPTERS.map((chapter) => (
                <Link
                  key={chapter.slug}
                  href={`/chapters/${chapter.slug}`}
                  onClick={closeDrawer}
                  className="rounded-xl px-4 py-3 text-base font-medium text-gray-200 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                >
                  {chapter.name}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={closeDrawer}
                    className="rounded-xl px-4 py-3 text-base font-medium text-gray-200 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/profile/edit"
                    onClick={closeDrawer}
                    className="rounded-xl px-4 py-3 text-base font-medium text-gray-200 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/hackathon"
                    onClick={closeDrawer}
                    className="rounded-xl px-4 py-3 text-base font-medium text-gray-200 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                  >
                    Hackathon
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-base font-medium text-gray-200 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                  >
                    <FiLogOut aria-hidden="true" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="mt-1 flex items-center gap-2 px-2 pb-1">
                  <Link
                    href={`/login?from=${encodeURIComponent(pathname)}`}
                    onClick={closeDrawer}
                    className="flex-1 rounded-full border border-white/30 bg-transparent px-4 py-2 text-center text-sm font-medium text-white transition-all duration-200 hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/signup?from=${encodeURIComponent(pathname)}`}
                    onClick={closeDrawer}
                    className="flex-1 rounded-full bg-white px-4 py-2 text-center text-sm font-medium text-black transition-all duration-200 hover:bg-gray-200"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.nav>
    </>
  );
};

export default TopNavbar;
