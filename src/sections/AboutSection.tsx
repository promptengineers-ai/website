"use client";

const AboutSection = () => {
  return (
    <div id="about" className="bg-black py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="relative flex justify-center">
            <div
              className="absolute rounded-lg bg-indigo-700 opacity-40"
              style={{
                width: "79%",
                height: "70%",
                bottom: "0%",
                right: "10.5%",
                opacity: 0.6,
                zIndex: 0,
                borderRadius: "10px 10px 10px 10px",
              }}
            ></div>
            <img
              src="/images/ryan_egg.png"
              alt="Founder"
              className="relative z-10 rounded-[0px_0px_10px_10px]"
              style={{
                filter: "drop-shadow(0px 2px 5px black)",
                zIndex: 1,
              }}
            />
            <div className="absolute bottom-4 right-4 z-20 rounded bg-white p-2 shadow-md">
              <p className="font-bold text-black">Ryan Eggleston</p>
              <p className="text-sm text-gray-700">Founder & Core Developer</p>
            </div>
          </div>
          <div>
            <h2 className="mb-8 text-4xl font-bold text-white">
              My Promise...
            </h2>
            <p className="mb-10 text-base text-gray-300">
              To listen to your feedback and bring you the features you want
              most. I will be implementing a suggestion form so that you can
              tell me what you'd like to see and the community will vote on the
              features they want to see implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
