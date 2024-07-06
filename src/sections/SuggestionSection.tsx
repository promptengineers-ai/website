"use client";
import { useState } from "react";

const SuggestionSection = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feature, setFeature] = useState("");

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const newFeature = {
      id: features.length + 1,
      name,
      email,
      feature,
      upvotes: 0,
      status: "backlog",
    };
    setFeatures([newFeature, ...features]);
    setName("");
    setEmail("");
    setFeature("");
  };

  const handleUpvote = (id: string) => {
    setFeatures(
      features.map((feature: any) =>
        feature.id === id
          ? { ...feature, upvotes: feature.upvotes + 1 }
          : feature,
      ),
    );
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
                    <div className="flex justify-between">
                      <div>
                        <p className="font-bold text-gray-300">
                          {feature.feature}
                        </p>
                        <p className="text-sm text-gray-400">
                          by {feature.name}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-end">
                          <p className="mr-3 text-gray-300">Status:</p>
                          <span className="rounded-full bg-indigo-700 px-2 py-1 text-xs font-semibold text-gray-300">
                            {feature.status}
                          </span>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => handleUpvote(feature.id)}
                            className="mr-3 text-indigo-400"
                          >
                            Upvote
                          </button>
                          <p className="text-gray-300">{feature.upvotes}</p>
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
