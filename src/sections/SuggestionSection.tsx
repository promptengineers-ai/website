"use client";
import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const SuggestionSection = () => {
  const [features, setFeatures] = useState<any[]>([
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      title: "Dark Mode",
      feature:
        "Add a dark mode option to the website for better night-time usability.",
      upvotes: 10,
      status: "backlog",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      title: "Notifications",
      feature: "Implement a notification system to alert users of new updates.",
      upvotes: 7,
      status: "backlog",
    },
    {
      id: 3,
      name: "Carol Williams",
      email: "carol@example.com",
      title: "Profile Customization",
      feature:
        "Allow users to customize their profiles with pictures and bios.",
      upvotes: 5,
      status: "backlog",
    },
  ]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [featureTitle, setFeatureTitle] = useState("");
  const [feature, setFeature] = useState("");
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(
    new Set(),
  );

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const newFeature = {
      id: features.length + 1,
      name,
      email,
      title: featureTitle,
      feature,
      upvotes: 0,
      status: "backlog",
    };
    setFeatures([newFeature, ...features]);
    setName("");
    setEmail("");
    setFeatureTitle("");
    setFeature("");
  };

  const handleUpvote = (id: number) => {
    setFeatures(
      features.map((feature: any) =>
        feature.id === id
          ? { ...feature, upvotes: feature.upvotes + 1 }
          : feature,
      ),
    );
  };

  const toggleDescription = (id: number) => {
    setExpandedFeatures((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div id="suggestions" className="bg-black py-20">
      <div className="container mx-auto px-6 md:px-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-4xl font-bold text-white">
              Feature Requests
            </h3>
            <ul>
              {features
                .sort((a, b) => b.upvotes - a.upvotes)
                .map((feature) => (
                  <li
                    key={feature.id}
                    className="mb-4 rounded-lg bg-gray-800 p-4 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10/12">
                        <div className="flex items-center">
                          <p className="font-bold text-gray-300">
                            {feature.title}
                          </p>
                          <button
                            onClick={() => toggleDescription(feature.id)}
                            className="ml-2 text-gray-400 focus:outline-none"
                          >
                            {expandedFeatures.has(feature.id) ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </button>
                        </div>
                        {expandedFeatures.has(feature.id) && (
                          <p className="mt-2 text-xs text-gray-400">
                            {feature.feature}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-gray-400">
                          by {feature.name}
                        </p>
                      </div>
                      <div className="w-2/12 text-right">
                        <span className="mr-3 rounded-full bg-indigo-700 px-2 py-1 text-xs font-semibold text-gray-300">
                          {feature.status}
                        </span>
                        <div className="mt-2 flex flex-col items-end">
                          <div className="flex">
                            <button
                              onClick={() => handleUpvote(feature.id)}
                              className="mr-1 text-indigo-400"
                            >
                              Upvote:
                            </button>
                            <p className="text-gray-300">{feature.upvotes}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
          <div className="w-full max-w-lg">
            <h3 className="mb-4 text-4xl font-bold text-white">
              Suggest a Feature
            </h3>
            <form
              className="mb-4 rounded-lg bg-gray-800 px-8 pb-8 pt-6 shadow-lg"
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
                  onChange={(e) => setName(e.target.value)}
                  value={name}
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
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>
              <div className="mb-4">
                <label
                  className="mb-2 block text-sm font-bold text-gray-300"
                  htmlFor="title"
                >
                  Title
                </label>
                <input
                  required
                  className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-3 py-2 leading-tight text-gray-300 shadow focus:outline-none"
                  id="title"
                  type="text"
                  placeholder="Feature Title"
                  onChange={(e) => setFeatureTitle(e.target.value)}
                  value={featureTitle}
                />
              </div>
              <div className="mb-4">
                <label
                  className="mb-2 block text-sm font-bold text-gray-300"
                  htmlFor="feature"
                >
                  Feature Request
                </label>
                <textarea
                  required
                  className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-3 py-2 leading-tight text-gray-300 shadow focus:outline-none"
                  id="feature"
                  rows={4}
                  placeholder="Describe the feature you would like to see"
                  onChange={(e) => setFeature(e.target.value)}
                  value={feature}
                ></textarea>
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="focus:shadow-outline flex items-center justify-center gap-2 rounded bg-indigo-500 px-4 py-2 font-bold text-white transition-colors duration-150 hover:bg-indigo-700 focus:outline-none"
                  type="submit"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionSection;