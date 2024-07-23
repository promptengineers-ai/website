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
  buttonText: "I Want To Join The Waitlist!",
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
    <div id="contact" className="bg-black py-20">
      <div className="container mx-auto px-3">
        <h2 className="mb-8 text-center text-4xl font-bold text-white md:text-8xl">
          Stay in the Loop!
        </h2>
        <p className="mb-3 text-center text-2xl text-gray-300">
          Be the first to know when new features are released. <br />
          Sign up below to stay up-to-date with the latest releases and
          announcements.
        </p>

        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <form
              className="mb-4 rounded-lg px-8 pb-8 pt-6 shadow-lg"
              onSubmit={handleSubmit}
            >
              <div className="mb-6">
                <input
                  required
                  className={`focus:shadow-outline ${!successful ? "bg-gray-700" : "bg-gray-800"} w-full appearance-none rounded border border-gray-600 px-4 py-3 text-lg leading-tight text-gray-300 shadow focus:outline-none`}
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
              <div className="mb-6">
                <input
                  required
                  className={`focus:shadow-outline w-full appearance-none rounded border border-gray-600 ${!successful ? "bg-gray-700" : "bg-gray-800"} px-4 py-3 text-lg leading-tight text-gray-300 shadow focus:outline-none`}
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

            <FaqList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
