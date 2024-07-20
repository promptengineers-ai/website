"use client";
import { useState } from "react";
import { apiClient } from "@/utils/client";
import InputMask from "react-input-mask";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { FaChevronDown as ChevronDownIcon } from "react-icons/fa";

const initState = {
  payload: {
    Name: "",
    Email: "",
    Phone: "",
    Message: "",
  },
};

const ContactSection = () => {
  // State for the contact form
  const [payload, setPayload] = useState(initState.payload);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Call the API to submit the contact form
      await apiClient.contactFormSubmit(payload);
      // Reset the form
      setPayload(initState.payload);
      setLoading(false);
      alert("Message sent successfully!");
    } catch (error) {
      console.error(error);
      alert(error);
      setLoading(false);
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
                  className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-4 py-3 text-lg leading-tight text-gray-300 shadow focus:outline-none"
                  id="name"
                  type="text"
                  placeholder="Enter your full name..."
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, Name: e.target.value }))
                  }
                  disabled={loading}
                  value={payload.Name}
                />
              </div>
              <div className="mb-6">
                <input
                  required
                  className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-4 py-3 text-lg leading-tight text-gray-300 shadow focus:outline-none"
                  id="email"
                  type="email"
                  placeholder="Enter your email..."
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, Email: e.target.value }))
                  }
                  disabled={loading}
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
                  className="focus:shadow-outline flex w-full animate-pulse items-center justify-center gap-2 rounded bg-indigo-500 px-4 py-3 text-xl font-bold text-white transition-all duration-150 hover:animate-none hover:bg-indigo-700 focus:outline-none"
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
                    "I Want To Join The Waitlist!"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <h3 className="mb-4 text-center text-5xl font-bold text-white">
                FAQs
              </h3>
              <div className="mx-auto w-full max-w-4xl divide-y divide-white/5 rounded-xl bg-white/10">
                <Disclosure as="div" className="p-6" defaultOpen={true}>
                  <DisclosureButton className="group flex w-full items-center justify-between">
                    <span className="text-sm/6 font-medium text-white group-hover:text-white/80">
                      What is your refund policy?
                    </span>
                    <ChevronDownIcon className="size-5 fill-white/60 group-open:rotate-180 group-hover:fill-white/50" />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 text-sm/5 text-white/50">
                    If you're unhappy with your purchase, we'll refund you in
                    full.
                  </DisclosurePanel>
                </Disclosure>
                <Disclosure as="div" className="p-6">
                  <DisclosureButton className="group flex w-full items-center justify-between">
                    <span className="text-sm/6 font-medium text-white group-hover:text-white/80">
                      Do you offer technical support?
                    </span>
                    <ChevronDownIcon className="size-5 fill-white/60 group-open:rotate-180 group-hover:fill-white/50" />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 text-sm/5 text-white/50">
                    No.
                  </DisclosurePanel>
                </Disclosure>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
