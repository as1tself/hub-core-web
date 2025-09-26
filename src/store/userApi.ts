// src/store/userApi.ts
import {createApi} from "@reduxjs/toolkit/query/react";
import {baseQueryWithReauth} from "./baseQueryWithReauth";
import { setUser, clearUser } from "./userSlice";

export type User = {
    username: string; nickname: string; email: string; social: boolean;
};

export type ApiResponse<T> = {
    timestamp: string; requestId: string; status: number; code: string; message: string; path: string; result: T;
};

export const userApi = createApi({
    reducerPath: "userApi",
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        getUser: builder.query<User, void>({
            query: () => ({ url: "/user", method: "GET", credentials: "include" }),
            transformResponse: (res: ApiResponse<User>) => res.result,
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled; // data 타입 = User (transformResponse 적용 후)
                    dispatch(setUser(data));
                } catch {
                    // 요청 실패 시 유저 정보 전부 초기화
                    dispatch(clearUser());
                }
            },
        }),
    }),
});

export const {useGetUserQuery} = userApi;
