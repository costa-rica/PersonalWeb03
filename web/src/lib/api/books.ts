const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export interface BookItem {
  id: number
  book_id: number
  title: string
  author: string
  my_rating: number
  average_rating: number
  exclusive_shelf: string | null
  date_read: string | null
}

export interface UploadBooksSummary {
  inserted: number
  updated: number
  total: number
}

export async function fetchBooks(): Promise<BookItem[]> {
  const response = await fetch(`${API_BASE_URL}/books`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch books")
  }

  return response.json()
}

export async function uploadBooksCsv(
  file: File,
  token: string
): Promise<UploadBooksSummary> {
  const formData = new FormData()
  formData.append("csv_file", file)

  const response = await fetch(`${API_BASE_URL}/books/upload-csv`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to upload books CSV")
  }

  return response.json()
}
