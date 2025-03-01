"use client";
import { useState } from "react";
import { apiClient } from "@/utils/client";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { FaChevronDown as ChevronDownIcon } from "react-icons/fa";
import FaqList from "@/components/lists/FaqList";

const initState = {
  buttonText: "Join Waitlist",
  payload: {
    Name: "",
    Email: "",
    Phone: "",
    Message: "",
  },
};

const ContactSection = () => {
  // State for the contact form
  const [buttonText, setButtonText] = useState(initState.buttonText);
  const [payload, setPayload] = useState(initState.payload);
  const [loading, setLoading] = useState(false);

  const successful = buttonText !== initState.buttonText;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    // Call the API to submit the contact form
    const res = await apiClient.contactFormSubmit(payload);
    // Reset the form
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setButtonText(data.message);
      alert(data.message);
    } else {
      console.error(data.message);
      alert(data.message);
    }
  };

  return (
    <div id="contact" className="bg-black py-36 h-screen">
      <div className="container mx-auto px-3">
        <h2 className="text-center mb-3 text-7xl font-bold text-white">
              Make Every<br />Moment{" "}
          <a
            href="/#contact"
            className="text-indigo-500 hover:text-indigo-700"
          >
            Count
          </a>
        </h2>
        <p className="mb-3 text-center text-xl text-gray-300">
          Register your email to get early access.
        </p>

        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <form
              className="mb-4 rounded-lg px-8 pb-8 pt-6 shadow-lg"
              onSubmit={handleSubmit}
            >
              <div className="mb-6 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  required
                  className={`focus:shadow-outline ${!successful ? "bg-gray-700" : "bg-gray-800"} w-full appearance-none rounded border border-gray-600 px-4 py-3 pl-12 text-lg leading-tight text-gray-300 shadow focus:outline-none`}
                  id="name"
                  type="text"
                  placeholder="Enter Name..."
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, Name: e.target.value }))
                  }
                  disabled={loading || successful}
                  value={payload.Name}
                />
              </div>
              <div className="mb-6 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  required
                  className={`focus:shadow-outline w-full appearance-none rounded border border-gray-600 ${!successful ? "bg-gray-700" : "bg-gray-800"} px-4 py-3 pl-12 text-lg leading-tight text-gray-300 shadow focus:outline-none`}
                  id="email"
                  type="email"
                  placeholder="Enter Email..."
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, Email: e.target.value }))
                  }
                  disabled={loading || successful}
                  value={payload.Email}
                />
              </div>
              {/* <div className="mb-6">
                <InputMask
                  mask="(999) 999-9999"
                  value={payload.Phone}
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, Phone: e.target.value }))
                  }
                  disabled={loading}
                  className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-4 py-3 text-lg leading-tight text-gray-300 shadow focus:outline-none"
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number..."
                />
              </div> */}
              <div className="flex items-center justify-between">
                <button
                  disabled={loading || successful}
                  className={`focus:shadow-outline flex w-full animate-pulse items-center justify-center gap-2 rounded ${!successful ? "bg-indigo-500" : "bg-green-600"} px-4 py-3 text-xl font-bold text-white transition-all duration-150 hover:animate-none ${!successful ? "hover:bg-indigo-700" : "hover:bg-green-700"} focus:outline-none`}
                  type="submit"
                >
                  {loading ? (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-white border-t-transparent"></div>
                        <span>Sending...</span>
                      </div>
                    </>
                  ) : (
                    buttonText
                  )}
                </button>
              </div>
            </form>

            {/* <FaqList /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
