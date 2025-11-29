import Image from "next/image";
import Link from "next/link";
import { FaMapMarkerAlt, FaBriefcase, FaUserFriends, FaUsers, FaLink } from "react-icons/fa";

type MemberCardProps = {
  member: {
    _id: string;
    userId: string;
    name: string;
    avatarUrl?: string;
    seeking: string | string[];
    background?: string;
  };
};

export default function MemberCard({ member }: MemberCardProps) {
  const getSeekingIcon = (seeking: string) => {
    switch (seeking) {
      case "work":
        return <FaBriefcase className="h-3 w-3" />;
      case "hiring":
        return <FaUsers className="h-3 w-3" />;
      case "networking":
        return <FaUserFriends className="h-3 w-3" />;
      default:
        return <FaLink className="h-3 w-3" />;
    }
  };

  const getSeekingLabel = (seeking: string) => {
    switch (seeking) {
      case "work":
        return "Seeking Work";
      case "hiring":
        return "Hiring";
      case "networking":
        return "Networking";
      default:
        return seeking.charAt(0).toUpperCase() + seeking.slice(1);
    }
  };

  // Extract location from background if possible (simple heuristic)
  // Or just display "Member"
  // For now, let's just show seeking tags.
  
  const seekingArray = Array.isArray(member.seeking)
    ? member.seeking
    : [member.seeking];

  return (
    <Link href={`/members/${member.userId}`} className="block h-full">
      <div className="group h-full overflow-hidden rounded-lg border border-gray-800 bg-gray-900 transition-all hover:border-blue-500 hover:shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-700 bg-gray-800">
              {member.avatarUrl ? (
                <Image
                  src={member.avatarUrl}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-500">
                  <span className="text-xl font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400">
                {member.name}
              </h3>
              {/* Could extract title/role from background if we had a structured field */}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {seekingArray.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-200"
              >
                {getSeekingIcon(s)}
                {getSeekingLabel(s)}
              </span>
            ))}
          </div>

          {member.background && (
             <div className="mt-4 text-sm text-gray-400 line-clamp-3">
                 {/* Strip HTML tags for preview */}
                 {member.background.replace(/<[^>]*>/g, '').substring(0, 150)}
                 {member.background.length > 150 && "..."}
             </div>
          )}
        </div>
      </div>
    </Link>
  );
}

