import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UserState {
  email: string | null
  token: string | null
  adminSections: {
    [key: string]: boolean // section ID -> isOpen
  }
}

const initialState: UserState = {
  email: null,
  token: null,
  adminSections: {},
}

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ email: string; token: string }>) => {
      state.email = action.payload.email
      state.token = action.payload.token
    },
    clearUser: (state) => {
      state.email = null
      state.token = null
      state.adminSections = {}
    },
    toggleAdminSection: (state, action: PayloadAction<string>) => {
      const sectionId = action.payload
      state.adminSections[sectionId] = !state.adminSections[sectionId]
    },
  },
})

export const { setUser, clearUser, toggleAdminSection } = userSlice.actions
export default userSlice.reducer
