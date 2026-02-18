"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getBlogPost, type BlogPost } from "@/lib/api/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postId = params.id as string;
        const data = await getBlogPost(postId);
        setPost(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load blog post"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="border-2 border-black rounded-3xl p-12 bg-white max-w-2xl text-center">
          <h1 className="text-2xl font-bold font-mono mb-4 text-red-600">
            Error
          </h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link
            href="/#blog"
            className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white font-mono rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/#blog"
            className="inline-flex items-center gap-2 mb-6 text-gray-700 hover:text-black transition-colors font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Blog Post Container */}
          <div className="border-2 border-black rounded-3xl p-6 lg:p-12 bg-white">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold font-mono mb-4">
                {post.title}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span>{formatDate(post.date_shown_on_blog)}</span>
              </div>

              <hr className="border-t-2 border-black" />
            </div>

            {/* Markdown Content */}
            <div className="prose prose-lg max-w-none">
              <MarkdownRenderer
                content={post.markdown_content}
                directoryName={post.directory_name}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
