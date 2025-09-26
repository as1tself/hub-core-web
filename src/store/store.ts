import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { userApi } from "./userApi";
import { apiHistoryApi } from "./apiHistoryApi"; // 새로 추가
import userReducer from "./userSlice";
import storage from "redux-persist/lib/storage"; // 기본은 localStorage
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["user"], // user state만 저장
};

const rootReducer = combineReducers({
    [userApi.reducerPath]: userApi.reducer,
    [apiHistoryApi.reducerPath]: apiHistoryApi.reducer, // 추가
    user: userReducer,
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
