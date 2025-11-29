"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { apiClient } from "@/utils/client";
import { FaGithub, FaSlack, FaMeetup } from "react-icons/fa";

const HeroSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiClient.contactFormSubmit({ 
        Email: email,
        // Name: "Newsletter Subscriber", 
        Referrer: "Enso Contact Form",
        Message: "Beta invite request" 
      });
      
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail("");
      
      // Reset success message after delay
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black text-white">
      {/* Logo/Icon Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-5 flex items-center justify-center"
      >
        <div className="text-7xl">🤖</div>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mb-6 text-center text-4xl font-bold tracking-tight md:text-6xl"
      >
        Prompt Engineers
        <br />
        <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          AI Community
        </span>
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mb-8 max-w-2xl text-center text-xl font-light text-gray-300"
      >
        Join 1,700+ developers and tech enthusiasts in Plano, TX exploring
        ChatGPT, LLMs, and the future of AI
      </motion.p>

      {/* Primary CTA - Survey Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="mb-12 flex flex-col items-center gap-4"
      >
        <a
          href="https://forms.gle/DYBEgiiFGUUisw7V6"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative transform rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <span className="relative z-10">Take Our Community Survey</span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
        </a>
        <p className="text-sm text-gray-400">
          Help shape the future of our AI community
        </p>
      </motion.div>

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="mb-12 flex flex-wrap justify-center gap-8 text-center"
      >
        <div>
          <div className="text-3xl font-bold text-blue-400">1,700+</div>
          <div className="text-sm text-gray-400">Members</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-purple-400">15+</div>
          <div className="text-sm text-gray-400">Events Hosted</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-green-400">4.6/5</div>
          <div className="text-sm text-gray-400">Rating</div>
        </div>
      </motion.div>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        className="flex justify-center gap-6"
      >
        <a
          href="https://join.slack.com/t/promptengineersai/shared_invite/zt-21upjsftv-gX~gNjTCU~2HfbeM_ZwTEQ"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white"
        >
          <FaSlack className="text-2xl transition-transform group-hover:scale-110" />
          <span>Slack</span>
        </a>
        <a
          href="https://www.meetup.com/plano-prompt-engineers/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white"
        >
          <FaMeetup className="text-2xl transition-transform group-hover:scale-110" />
          <span>Meetup</span>
        </a>
        <a
          href="https://github.com/promptengineers-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white"
        >
          <FaGithub className="text-2xl transition-transform group-hover:scale-110" />
          <span>GitHub</span>
        </a>
      </motion.div>
    </div>
  );
};

export default HeroSection;
