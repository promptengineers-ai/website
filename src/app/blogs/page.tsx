"use server";

import { Suspense } from "react";
import Image from "next/image";
import TopNavbar from "@/components/nav/TopNavBar";
import Link from "next/link";
import Loading from "@/components/loaders/Loading";
import { socialIcons } from "@/config/app";
import { HERO_GIF } from "@/config/static";
import { rssToJson } from "@/utils/rss";
import { MEDIUM_RSS_URL } from "@/config/app";
import { formatDate } from "@/utils/format";

const AuthorInfo = ({ blog }: { blog: any }) => (
  <div className="flex items-center rounded-b-lg pt-3">
    <Image
      src="https://avatars.githubusercontent.com/u/40816745?s=400&u=f2d7532a21510a6d122dfb725453daf88d614947&v=4"
      alt={blog.author}
      width={50}
      height={50}
      className="rounded-full"
    />
    <div className="ml-3">
      <div className="text-sm font-semibold text-white">{blog.author}</div>
      <div className="text-xs text-gray-400">{formatDate(blog.published)}</div>
    </div>
  </div>
);

// Define getServerSideProps to fetch blog data
async function Blogs() {
  const blogs = await rssToJson(MEDIUM_RSS_URL);
  console.log(blogs);
  if (true) return null;
  return (
    <>
      {blogs.map((blog: any) => (
        <div
          key={blog.id}
          style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          className="cursor-pointer rounded-lg bg-slate-900 shadow transition duration-300 ease-in-out hover:shadow-lg"
        >
          <img
            // layout="fill"
            // unoptimized={true}
            src={blog.images[0]}
            // loader={() => blog.images[0]}
            alt={blog.title}
            width={300}
            height={200}
            className="h-48 w-full rounded-t-lg object-cover"
          />
          <div className="flex-grow p-4 text-black">
            <div className="no-scrollbar flex flex-nowrap overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {blog.category.map((category: string, index: number) => (
                <div
                  key={index}
                  className="m-1 flex items-center justify-center rounded-full border border-green-700 bg-green-900 px-2 py-1 font-medium text-white"
                >
                  <div
                    className="max-w-full flex-initial whitespace-nowrap text-xs font-normal leading-none"
                    title={category}
                  >
                    {category}
                  </div>
                </div>
              ))}
            </div>

            {/* Move padding inside this div */}
            <Link href={`/blogs/${blog.slug}`} passHref>
              <h3
                className="mb-1 text-lg font-semibold text-white"
                dangerouslySetInnerHTML={{ __html: blog.title }}
              ></h3>
            </Link>
            <p className="h-[110px] text-xs text-gray-400 lg:h-[90px]">
              {blog.excerpt}...
            </p>
            <AuthorInfo blog={blog} />
          </div>
        </div>
      ))}
    </>
  );
}

// Define the BlogIndex component that accepts blogs as a prop
const BlogIndex = async () => {
  return (
    <main>
      <TopNavbar />
      <div
        className="min-h-screen bg-black bg-cover bg-center bg-no-repeat py-20"
        style={{ backgroundImage: `url('${HERO_GIF}')` }}
      >
        <div className="container mx-auto px-6">
          <div className="z-5 flex items-start justify-start lg:absolute lg:left-2 lg:top-1/2 lg:mt-5 lg:-translate-y-1/2 lg:flex-col lg:items-start lg:justify-start lg:pl-4">
            {socialIcons.map(({ Icon, tooltip, key, link }) => (
              <div
                className="group relative mb-4 mr-3 text-5xl text-white lg:mb-6 lg:mr-0"
                key={key}
              >
                <div className="absolute bottom-full mb-3 hidden w-auto rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:block group-hover:opacity-100">
                  {tooltip}
                </div>
                <Link href={link} target="_blank">
                  <Icon />
                </Link>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <Suspense fallback={<Loading />}>
              <Blogs />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BlogIndex;
