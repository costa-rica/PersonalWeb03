const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

interface AuthResponse {
  access_token: string
  token_type: string
}

interface AuthCredentials {
  email: string
  password: string
}

export async function registerUser(credentials: AuthCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Registration failed")
  }

  return response.json()
}

export async function loginUser(credentials: AuthCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Login failed")
  }

  return response.json()
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to send reset email")
  }

  return response.json()
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, new_password: newPassword }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to reset password")
  }

  return response.json()
}
