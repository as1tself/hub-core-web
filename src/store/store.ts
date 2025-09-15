import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "./userApi";
import userReducer from "./userSlice";
import storage from "redux-persist/lib/storage"; // 기본은 localStorage
import { persistReducer, persistStore } from "redux-persist";
import { combineReducers } from "redux";

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["user"], // user state만 저장
};

const rootReducer = combineReducers({
    [userApi.reducerPath]: userApi.reducer,
    user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }).concat(userApi.middleware),
});

export const persistor = persistStore(store);

// 타입 헬퍼
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
