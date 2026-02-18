import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistStore, persistReducer } from "redux-persist"
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2"
import storage from "redux-persist/lib/storage"
import userReducer from "./features/userSlice"

// Combine all reducers
const rootReducer = combineReducers({
  user: userReducer,
})

// Persist configuration
const persistConfig = {
  key: "root",
  storage,
  stateReconciler: autoMergeLevel2,
  whitelist: ["user"], // Only persist user slice
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }),
  })
  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]

// Create persistor
export const persistor = (store: AppStore) => persistStore(store)
