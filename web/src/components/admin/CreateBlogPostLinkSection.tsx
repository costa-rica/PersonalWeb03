"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ChevronDown, ChevronRight, Link as LinkIcon } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/hooks"
import { toggleAdminSection } from "@/lib/features/userSlice"
import { createBlogPostLink, getBlogIcons } from "@/lib/api/blog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Modal from "@/components/ui/modal"
import ModalInformationOk from "@/components/ui/modal/ModalInformationOk"

const createLinkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  icon: z.string().optional(),
  date_shown_on_blog: z.string().optional(),
})

type CreateLinkFormData = z.infer<typeof createLinkSchema>

interface CreateBlogPostLinkSectionProps {
  token: string
  onLoadingChange: (loading: boolean) => void
  onSuccess?: () => void
}

export default function CreateBlogPostLinkSection({
  token,
  onLoadingChange,
  onSuccess,
}: CreateBlogPostLinkSectionProps) {
  const dispatch = useAppDispatch()
  const adminSections = useAppSelector((state) => state.user.adminSections)
  const isOpen = adminSections["create-blog-link"] || false

  const [icons, setIcons] = useState<string[]>([])
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: "success" | "error"
    title: string
    message: string
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
  })

  // Fetch available icons when section is opened
  useEffect(() => {
    const fetchIcons = async () => {
      if (!isOpen) return

      try {
        const iconsList = await getBlogIcons(token)
        setIcons(iconsList)
      } catch (err) {
        console.error("Failed to fetch icons:", err)
        setIcons([])
      }
    }

    fetchIcons()
  }, [isOpen, token])

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: "success",
      title: "",
      message: "",
    })

    // If success, call onSuccess callback
    if (modalState.type === "success" && onSuccess) {
      onSuccess()
    }
  }

  const onSubmit = async (data: CreateLinkFormData) => {
    onLoadingChange(true)
    try {
      const result = await createBlogPostLink(
        {
          title: data.title,
          url: data.url,
          description: data.description,
          icon: data.icon,
          date_shown_on_blog: data.date_shown_on_blog,
        },
        token
      )

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: result.message,
      })
      reset()
    } catch (err) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to create blog post link",
      })
    } finally {
      onLoadingChange(false)
    }
  }

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={() => dispatch(toggleAdminSection("create-blog-link"))}
        className="border-2 border-black rounded-lg"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <h2 className="text-xl font-mono font-bold">Create Blog Post Link</h2>
            {isOpen ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t-2 border-black p-6">
            <p className="text-sm text-gray-600 font-mono mb-6">
              Create a link to an external blog post (e.g., Medium, Dev.to).
            </p>

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
                  placeholder="My Blog Post on Medium"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 font-mono">{errors.title.message}</p>
                )}
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="url" className="font-mono">
                  URL *
                </Label>
                <Input
                  id="url"
                  type="url"
                  {...register("url")}
                  className="font-mono"
                  placeholder="https://medium.com/@user/my-post"
                />
                {errors.url && (
                  <p className="text-sm text-red-600 font-mono">{errors.url.message}</p>
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
                  rows={3}
                  placeholder="A brief description of the blog post"
                />
                {errors.description && (
                  <p className="text-sm text-red-600 font-mono">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="icon" className="font-mono">
                  Icon
                </Label>
                <select
                  id="icon"
                  {...register("icon")}
                  className="w-full border-2 border-black rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">-- Select Icon --</option>
                  {icons.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                {errors.icon && (
                  <p className="text-sm text-red-600 font-mono">{errors.icon.message}</p>
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
                />
                {errors.date_shown_on_blog && (
                  <p className="text-sm text-red-600 font-mono">
                    {errors.date_shown_on_blog.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 font-mono">
                  Leave empty to use today's date
                </p>
              </div>

              <Button type="submit" className="font-mono w-full sm:w-auto">
                <LinkIcon className="h-4 w-4 mr-2" />
                Create Blog Post Link
              </Button>
            </form>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
  )
}
