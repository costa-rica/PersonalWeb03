const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export interface RestoreSummary {
  message: string
  summary: {
    users_imported: number
    users_skipped: number
    posts_imported: number
    posts_skipped: number
    skipped_details: string[]
  }
}

export async function backupDatabase(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/database/backup`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Database backup failed")
  }

  // Get the filename from Content-Disposition header
  const contentDisposition = response.headers.get("Content-Disposition")
  let filename = "database_backup.zip"
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
    if (filenameMatch) {
      filename = filenameMatch[1]
    }
  }

  // Download the file
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function restoreDatabase(
  zipFile: File,
  token: string
): Promise<RestoreSummary> {
  const formData = new FormData()
  formData.append("zip_file", zipFile)

  const response = await fetch(`${API_BASE_URL}/admin/database/restore`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Database restore failed")
  }

  return response.json()
}
