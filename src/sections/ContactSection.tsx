"use client";
import { useState } from "react";
import { apiClient } from "@/utils/client";
import InputMask from "react-input-mask";

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
        <h2 className="mb-8 text-center text-4xl font-bold text-white">
          Join our Waitlist
        </h2>
        <p className="mb-5 text-center text-base text-gray-300">
          Be the first to know when new features are released.

        </p>

        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            <form
              className="mb-4 rounded-lg px-8 pb-8 pt-6 shadow-lg"
              onSubmit={handleSubmit}
            >
              <div className="mb-4">
                <label
                  className="mb-2 block text-sm font-bold text-gray-300"
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  required
                  className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-3 py-2 leading-tight text-gray-300 shadow focus:outline-none"
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, Name: e.target.value }))
                  }
                  disabled={loading}
                  value={payload.Name}
                />
              </div>
              <div className="mb-4">
                <label
                  className="mb-2 block text-sm font-bold text-gray-300"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  required
                  className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-3 py-2 leading-tight text-gray-300 shadow focus:outline-none"
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, Email: e.target.value }))
                  }
                  disabled={loading}
                  value={payload.Email}
                />
              </div>
              <div className="mb-4">
                <label
                  className="mb-2 block text-sm font-bold text-gray-300"
                  htmlFor="phone"
                >
                  Phone
                </label>
                <InputMask
                  mask="(999) 999-9999"
                  value={payload.Phone}
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, Phone: e.target.value }))
                  }
                  disabled={loading}
                  className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-3 py-2 leading-tight text-gray-300 shadow focus:outline-none"
                  id="phone"
                  type="tel"
                  placeholder="(480) 555-1234"
                />
              </div>
              {/* <div className="mb-6">
                <label
                  className="mb-2 block text-sm font-bold text-gray-300"
                  htmlFor="message"
                >
                  Message
                </label>
                <textarea
                  required
                  className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-3 py-2 leading-tight text-gray-300 shadow focus:outline-none"
                  id="message"
                  rows={4}
                  placeholder="How can we help you?"
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, Message: e.target.value }))
                  }
                  disabled={loading}
                  value={payload.Message}
                ></textarea>
              </div> */}
              <div className="flex items-center justify-between">
                <button
                  className="focus:shadow-outline flex items-center justify-center gap-2 rounded bg-indigo-500 px-4 py-2 font-bold text-white transition-colors duration-150 hover:bg-indigo-700 focus:outline-none"
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
                    "Send"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
