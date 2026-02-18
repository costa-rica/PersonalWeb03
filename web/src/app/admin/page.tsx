"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Search,
  Trash2,
  Edit,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { toggleAdminSection } from "@/lib/features/userSlice";
import {
  createPost,
  getAllBlogPosts,
  deleteBlogPost,
  type BlogListItem,
} from "@/lib/api/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import LoadingOverlay from "@/components/LoadingOverlay";
import Modal from "@/components/ui/modal";
import ModalInformationOk from "@/components/ui/modal/ModalInformationOk";
import ModalInformationYesOrNo from "@/components/ui/modal/ModalInformationYesOrNo";
import ModalUpdatePost from "@/components/ui/modal/ModalUpdatePost";
import DatabaseManagementSection from "@/components/admin/DatabaseManagementSection";
import CreateBlogPostLinkSection from "@/components/admin/CreateBlogPostLinkSection";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  zipFile: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "ZIP file is required")
    .refine(
      (files) =>
        files[0]?.type === "application/zip" ||
        files[0]?.type === "application/x-zip-compressed",
      "Only .zip files are allowed"
    ),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function AdminPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.user.token);
  const adminSections = useAppSelector((state) => state.user.adminSections);
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const isUploadOpen = adminSections["upload-blog"] || false;
  const isManageOpen = adminSections["manage-blogs"] || false;

  // Blog management state
  const [blogPosts, setBlogPosts] = useState<BlogListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    postId: number | null;
    postTitle: string;
  }>({
    isOpen: false,
    postId: null,
    postTitle: "",
  });
  const [updateModal, setUpdateModal] = useState<{
    isOpen: boolean;
    postId: number | null;
  }>({
    isOpen: false,
    postId: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  // Fetch blog posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const posts = await getAllBlogPosts();
        setBlogPosts(posts);
      } catch (err) {
        console.error("Failed to fetch blog posts:", err);
      }
    };

    if (token) {
      fetchPosts();
    }
  }, [token]);

  // Filter and paginate posts
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return blogPosts;

    const query = searchQuery.toLowerCase();
    return blogPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.id.toString().includes(query)
    );
  }, [blogPosts, searchQuery]);

  const totalPages =
    itemsPerPage === -1 ? 1 : Math.ceil(filteredPosts.length / itemsPerPage);
  const paginatedPosts = useMemo(() => {
    if (itemsPerPage === -1) return filteredPosts;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPosts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPosts, currentPage, itemsPerPage]);

  // Show nothing while checking auth or redirecting
  if (!token) {
    return null;
  }

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: "success",
      title: "",
      message: "",
    });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      postId: null,
      postTitle: "",
    });
  };

  const handleCloseUpdateModal = () => {
    setUpdateModal({
      isOpen: false,
      postId: null,
    });
  };

  const handleDeleteClick = (post: BlogListItem) => {
    setDeleteModal({
      isOpen: true,
      postId: post.id,
      postTitle: post.title,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.postId) return;

    setIsLoading(true);
    try {
      await deleteBlogPost(deleteModal.postId, token);

      // Refresh the blog list
      const posts = await getAllBlogPosts();
      setBlogPosts(posts);

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: "Blog post deleted successfully!",
      });
    } catch (err) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to delete blog post",
      });
    } finally {
      setIsLoading(false);
      handleCloseDeleteModal();
    }
  };

  const handleModifyClick = (post: BlogListItem) => {
    setUpdateModal({
      isOpen: true,
      postId: post.id,
    });
  };

  const handleUpdateSuccess = async () => {
    // Refresh the blog list after successful update
    try {
      const posts = await getAllBlogPosts();
      setBlogPosts(posts);
    } catch (err) {
      console.error("Failed to refresh blog posts:", err);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    setIsLoading(true);

    try {
      const file = data.zipFile[0];
      await createPost(data.title, file, token);

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: "Blog post created successfully!",
      });
      reset();
    } catch (err) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to create post",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 text-gray-700 hover:text-black transition-colors font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="text-3xl font-mono font-bold mb-6">Admin Dashboard</h1>

          {/* Upload Blog Markdown Section */}
          <Collapsible
            open={isUploadOpen}
            onOpenChange={() => dispatch(toggleAdminSection("upload-blog"))}
            className="border-2 border-black rounded-lg"
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <h2 className="text-xl font-mono font-bold">
                  Upload Blog Markdown
                </h2>
                {isUploadOpen ? (
                  <ChevronDown className="h-6 w-6" />
                ) : (
                  <ChevronRight className="h-6 w-6" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t-2 border-black p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-mono">
                      Title
                    </Label>
                    <Input
                      id="title"
                      {...register("title")}
                      className="font-mono"
                      disabled={isLoading}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 font-mono">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipFile" className="font-mono">
                      ZIP File
                    </Label>
                    <Input
                      id="zipFile"
                      type="file"
                      accept=".zip"
                      {...register("zipFile")}
                      className="font-mono"
                      disabled={isLoading}
                    />
                    {errors.zipFile && (
                      <p className="text-sm text-red-600 font-mono">
                        {errors.zipFile.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="font-mono"
                    disabled={isLoading}
                  >
                    Submit
                  </Button>
                </form>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Manage Blog Posts Section */}
          <Collapsible
            open={isManageOpen}
            onOpenChange={() => dispatch(toggleAdminSection("manage-blogs"))}
            className="border-2 border-black rounded-lg"
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <h2 className="text-xl font-mono font-bold">
                  Manage Blog Posts
                </h2>
                {isManageOpen ? (
                  <ChevronDown className="h-6 w-6" />
                ) : (
                  <ChevronRight className="h-6 w-6" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t-2 border-black p-6">
                {/* Search and Items Per Page */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Search by ID or title..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="font-mono text-sm whitespace-nowrap">
                      Show:
                    </Label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border-2 border-black rounded-lg px-3 py-2 font-mono text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={-1}>All</option>
                    </select>
                  </div>
                </div>

                {/* Table Container with Scroll */}
                <div className="border-2 border-black rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 sticky top-0 border-b-2 border-black">
                        <tr>
                          <th className="px-4 py-3 text-left font-mono font-bold border-r-2 border-black w-20">
                            ID
                          </th>
                          <th className="px-4 py-3 text-left font-mono font-bold border-r-2 border-black">
                            Title
                          </th>
                          <th className="px-4 py-3 text-center font-mono font-bold w-40">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPosts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-8 text-center text-gray-600 font-mono"
                            >
                              {searchQuery
                                ? "No posts found"
                                : "No blog posts yet"}
                            </td>
                          </tr>
                        ) : (
                          paginatedPosts.map((post) => (
                            <tr
                              key={post.id}
                              className="border-b border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 font-mono border-r border-gray-300">
                                {post.id}
                              </td>
                              <td className="px-4 py-3 border-r border-gray-300">
                                {post.title}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    onClick={() => handleModifyClick(post)}
                                    size="sm"
                                    variant="outline"
                                    className="font-mono"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteClick(post)}
                                    size="sm"
                                    variant="outline"
                                    className="font-mono text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {itemsPerPage !== -1 && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600 font-mono">
                      Page {currentPage} of {totalPages} ({filteredPosts.length}{" "}
                      total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        size="sm"
                        variant="outline"
                        className="font-mono"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        size="sm"
                        variant="outline"
                        className="font-mono"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Create Blog Post Link Section */}
          <CreateBlogPostLinkSection
            token={token}
            onLoadingChange={setIsLoading}
            onSuccess={handleUpdateSuccess}
          />

          {/* Database Management Section */}
          <DatabaseManagementSection
            token={token}
            onLoadingChange={setIsLoading}
          />
        </div>
      </div>

      {/* Modal for success/error messages */}
      <Modal isOpen={modalState.isOpen} onClose={handleCloseModal}>
        <ModalInformationOk
          title={modalState.title}
          message={modalState.message}
          variant={modalState.type}
          onClose={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={handleCloseDeleteModal}>
        <ModalInformationYesOrNo
          title="Delete Blog Post?"
          message={`Are you sure you want to delete "${deleteModal.postTitle}"? This action cannot be undone.`}
          onYes={handleDeleteConfirm}
          onClose={handleCloseDeleteModal}
          yesButtonText="Yes, Delete"
          yesButtonStyle="danger"
        />
      </Modal>

      {/* Update Blog Post Modal */}
      {updateModal.postId && (
        <Modal isOpen={updateModal.isOpen} onClose={handleCloseUpdateModal}>
          <ModalUpdatePost
            postId={updateModal.postId}
            token={token}
            onClose={handleCloseUpdateModal}
            onSuccess={handleUpdateSuccess}
          />
        </Modal>
      )}
    </>
  );
}
