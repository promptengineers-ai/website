import Image from "next/image";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import { CHAPTERS } from "@/config/chapters";

const LINK_CLASSES =
  "inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline";
const ICON_CLASSES = "h-4 w-4 shrink-0";

export default function ChapterOrganizers() {
  const entries = CHAPTERS.flatMap((chapter) =>
    chapter.organizers.map((organizer) => ({ chapter, organizer })),
  );

  if (entries.length === 0) return null;

  return (
    <section
      aria-labelledby="chapter-organizers-heading"
      className="bg-black px-4 py-16 text-white sm:px-6 lg:px-8"
    >
      <div className="container mx-auto">
        <div className="mb-8">
          <h2
            id="chapter-organizers-heading"
            className="text-2xl font-bold sm:text-3xl"
          >
            Chapter organizers
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Reach out to the person running your local chapter.
          </p>
        </div>

        <ul className="grid gap-6 md:grid-cols-2">
          {entries.map(({ chapter, organizer }) => (
            <li
              key={organizer.email}
              className="rounded-xl border border-white/15 bg-white/5 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium uppercase tracking-widest text-gray-400">
                    {chapter.city}, {chapter.state}
                  </h3>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {organizer.name}
                  </p>
                </div>
                <Image
                  src={organizer.photoUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-full border border-white/15 object-cover"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <a
                  href={organizer.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${organizer.name} on LinkedIn`}
                  className={LINK_CLASSES}
                >
                  <FaLinkedin className={ICON_CLASSES} />
                  LinkedIn
                </a>
                <a
                  href={organizer.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${organizer.name} on GitHub`}
                  className={LINK_CLASSES}
                >
                  <FaGithub className={ICON_CLASSES} />
                  GitHub
                </a>
                <a
                  href={`mailto:${organizer.email}`}
                  aria-label={`Email ${organizer.name}`}
                  className={LINK_CLASSES}
                >
                  <FaEnvelope className={ICON_CLASSES} />
                  Email
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
