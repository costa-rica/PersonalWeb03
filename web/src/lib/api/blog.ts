const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

interface CreatePostResponse {
  id: number
  title: string
  directory_name: string
  message: string
}

export interface BlogPost {
  id: number
  title: string
  description: string | null
  post_item_image: string | null
  directory_name: string | null
  date_shown_on_blog: string | null
  link_to_external_post: string | null
  created_at: string
  updated_at: string
  markdown_content: string | null
}

export interface BlogListItem {
  id: number
  title: string
  description: string | null
  post_item_image: string | null
  url: string | null
  date: string | null
}

interface DeletePostResponse {
  message: string
  id: number
}

interface GetIconsResponse {
  icons: string[]
}

interface UpdatePostRequest {
  title?: string
  description?: string
  post_item_image?: string
  date_shown_on_blog?: string
  link_to_external_post?: string
}

interface UpdatePostResponse {
  id: number
  title: string
  description: string | null
  post_item_image: string | null
  message: string
}

interface CreatePostLinkRequest {
  title: string
  url: string
  icon?: string
  description?: string
  date_shown_on_blog?: string
}

interface CreatePostLinkResponse {
  id: number
  title: string
  link_to_external_post: string
  post_item_image: string | null
  message: string
}

export async function createPost(
  title: string,
  zipFile: File,
  token: string
): Promise<CreatePostResponse> {
  const formData = new FormData()
  formData.append("title", title)
  formData.append("zip_file", zipFile)

  const response = await fetch(`${API_BASE_URL}/create-post`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to create post")
  }

  return response.json()
}

export async function getBlogPost(postId: string): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/blog/${postId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch blog post")
  }

  return response.json()
}

export async function getAllBlogPosts(): Promise<BlogListItem[]> {
  const response = await fetch(`${API_BASE_URL}/blog`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch blog posts")
  }

  return response.json()
}

export async function deleteBlogPost(
  postId: number,
  token: string
): Promise<DeletePostResponse> {
  const response = await fetch(`${API_BASE_URL}/blog/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to delete blog post")
  }

  return response.json()
}

export async function getBlogIcons(token: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/blog/icons`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch blog icons")
  }

  const data: GetIconsResponse = await response.json()
  return data.icons
}

export async function updateBlogPost(
  postId: number,
  updates: UpdatePostRequest,
  token: string
): Promise<UpdatePostResponse> {
  const response = await fetch(`${API_BASE_URL}/update-post/${postId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to update blog post")
  }

  return response.json()
}

export async function createBlogPostLink(
  data: CreatePostLinkRequest,
  token: string
): Promise<CreatePostLinkResponse> {
  const response = await fetch(`${API_BASE_URL}/blog/create-post-link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to create blog post link")
  }

  return response.json()
}
