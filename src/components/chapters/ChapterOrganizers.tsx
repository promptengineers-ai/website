import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import { CHAPTERS } from "@/config/chapters";

const LINK_CLASSES =
  "inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline";
const ICON_CLASSES = "h-4 w-4 shrink-0";

export default function ChapterOrganizers() {
  const chapters = CHAPTERS.filter((chapter) => chapter.organizers.length > 0);

  if (chapters.length === 0) return null;

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
          {chapters.map((chapter) => (
            <li
              key={chapter.slug}
              className="rounded-xl border border-white/15 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">
                {chapter.city}, {chapter.state}
              </h3>
              <ul className="mt-4 flex flex-col gap-4">
                {chapter.organizers.map((organizer) => (
                  <li key={organizer.email}>
                    <p className="font-semibold text-white">{organizer.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
