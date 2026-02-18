"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getBlogPost, getBlogIcons, updateBlogPost } from "@/lib/api/blog";
import LoadingOverlay from "@/components/LoadingOverlay";
import Modal from "@/components/ui/modal";
import ModalInformationOk from "@/components/ui/modal/ModalInformationOk";

const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  post_item_image: z.string().optional(),
  date_shown_on_blog: z.string().optional(),
  link_to_external_post: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type UpdatePostFormData = z.infer<typeof updatePostSchema>;

interface ModalUpdatePostProps {
  postId: number;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalUpdatePost({
  postId,
  token,
  onClose,
  onSuccess,
}: ModalUpdatePostProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [icons, setIcons] = useState<string[]>([]);
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdatePostFormData>({
    resolver: zodResolver(updatePostSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Fetch blog post details and icons in parallel
        const [post, iconsList] = await Promise.all([
          getBlogPost(postId.toString()),
          getBlogIcons(token),
        ]);

        // Pre-populate form with existing values
        reset({
          title: post.title,
          description: post.description || "",
          post_item_image: post.post_item_image || "",
          date_shown_on_blog: post.date_shown_on_blog || "",
          link_to_external_post: post.link_to_external_post || "",
        });

        setIcons(iconsList);
      } catch (err) {
        setModalState({
          isOpen: true,
          type: "error",
          title: "Error",
          message:
            err instanceof Error
              ? err.message
              : "Failed to load blog post data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [postId, token, reset]);

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: "success",
      title: "",
      message: "",
    });

    // If success, call onSuccess and close the update modal
    if (modalState.type === "success") {
      onSuccess();
      onClose();
    }
  };

  const onSubmit = async (data: UpdatePostFormData) => {
    setIsSaving(true);

    try {
      // Only send non-empty fields
      const updates: Record<string, string> = {};
      if (data.title) updates.title = data.title;
      if (data.description) updates.description = data.description;
      if (data.post_item_image) updates.post_item_image = data.post_item_image;
      if (data.date_shown_on_blog)
        updates.date_shown_on_blog = data.date_shown_on_blog;
      if (data.link_to_external_post)
        updates.link_to_external_post = data.link_to_external_post;

      await updateBlogPost(postId, updates, token);

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: "Blog post updated successfully!",
      });
    } catch (err) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to update blog post",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading || isSaving} />
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-mono font-bold mb-6">Update Blog Post</h2>

        {!isLoading && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="font-mono">
                Title *
              </Label>
              <Input
                id="title"
                {...register("title")}
                className="font-mono"
                disabled={isSaving}
              />
              {errors.title && (
                <p className="text-sm text-red-600 font-mono">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="font-mono">
                Description
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                className="font-mono"
                disabled={isSaving}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600 font-mono">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Post Item Image (Icon Dropdown) */}
            <div className="space-y-2">
              <Label htmlFor="post_item_image" className="font-mono">
                Post Item Image
              </Label>
              <select
                id="post_item_image"
                {...register("post_item_image")}
                className="w-full border-2 border-black rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                disabled={isSaving}
              >
                <option value="">-- Select Icon --</option>
                {icons.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              {errors.post_item_image && (
                <p className="text-sm text-red-600 font-mono">
                  {errors.post_item_image.message}
                </p>
              )}
            </div>

            {/* Date Shown on Blog */}
            <div className="space-y-2">
              <Label htmlFor="date_shown_on_blog" className="font-mono">
                Date Shown on Blog
              </Label>
              <Input
                id="date_shown_on_blog"
                type="date"
                {...register("date_shown_on_blog")}
                className="font-mono"
                disabled={isSaving}
              />
              {errors.date_shown_on_blog && (
                <p className="text-sm text-red-600 font-mono">
                  {errors.date_shown_on_blog.message}
                </p>
              )}
            </div>

            {/* Link to External Post */}
            <div className="space-y-2">
              <Label htmlFor="link_to_external_post" className="font-mono">
                Link to External Post (URL)
              </Label>
              <Input
                id="link_to_external_post"
                type="url"
                {...register("link_to_external_post")}
                className="font-mono"
                disabled={isSaving}
                placeholder="https://example.com/post"
              />
              {errors.link_to_external_post && (
                <p className="text-sm text-red-600 font-mono">
                  {errors.link_to_external_post.message}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-300">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="font-mono"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" className="font-mono" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Success/Error Modal */}
      <Modal isOpen={modalState.isOpen} onClose={handleCloseModal}>
        <ModalInformationOk
          title={modalState.title}
          message={modalState.message}
          variant={modalState.type}
          onClose={handleCloseModal}
        />
      </Modal>
    </>
  );
}
