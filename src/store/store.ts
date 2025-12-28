import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { userApi } from "./apis/userApi";
import { apiHistoryApi } from "./apis/apiHistoryApi";
import userReducer from "./slices/userSlice";
import noticeReducer from "./slices/noticeSlice";
import authReducer from "./slices/authSlice";
import storage from "redux-persist/lib/storage"; // 기본은 localStorage
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["user"], // user만 저장 (auth는 메모리에만 유지)
};

const rootReducer = combineReducers({
    [userApi.reducerPath]: userApi.reducer,
    [apiHistoryApi.reducerPath]: apiHistoryApi.reducer,
    user: userReducer,
    notice: noticeReducer,
    auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false })
            .concat(userApi.middleware)
            .concat(apiHistoryApi.middleware), // 추가
});

export const persistor = persistStore(store);

// 타입 헬퍼
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
