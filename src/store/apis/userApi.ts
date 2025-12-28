// src/store/apis/userApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";
import { setUser, clearUser } from "../slices/userSlice";
import { setAccessToken, clearAccessToken } from "../slices/authSlice";
import type { User, ApiResponse, LoginRequest, LoginResponse } from "../../types";

// 회원가입 요청 타입
interface RegisterRequest {
    username: string;
    password: string;
    nickname: string;
    email: string;
}

export const userApi = createApi({
    reducerPath: "userApi",
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        getUser: builder.query<User, void>({
            query: () => ({ url: "/user", method: "GET" }),
            transformResponse: (res: ApiResponse<User>) => res.result,
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setUser(data));
                } catch {
                    dispatch(clearUser());
                }
            },
        }),
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: "/login",
                method: "POST",
                body: credentials,
            }),
            transformResponse: (res: ApiResponse<LoginResponse>) => res.result,
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setAccessToken(data.accessToken));
                } catch {
                    // 로그인 실패 시 별도 처리 없음
                }
            },
        }),
        // 아이디 중복 확인
        checkUsernameExist: builder.mutation<boolean, { username: string }>({
            query: (body) => ({
                url: "/user/exist",
                method: "POST",
                body,
            }),
        }),
        // 회원가입
        registerUser: builder.mutation<void, RegisterRequest>({
            query: (body) => ({
                url: "/user",
                method: "POST",
                body,
            }),
        }),
        // 소셜 로그인 토큰 교환
        exchangeToken: builder.mutation<LoginResponse, void>({
            query: () => ({
                url: "/auth/exchange",
                method: "POST",
            }),
            transformResponse: (res: ApiResponse<LoginResponse>) => res.result,
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setAccessToken(data.accessToken));
                } catch {
                    // 토큰 교환 실패 시 별도 처리 없음
                }
            },
        }),
        // 로그아웃
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                } finally {
                    // 성공/실패 관계없이 로컬 상태 정리
                    dispatch(clearAccessToken());
                    dispatch(clearUser());
                    dispatch(userApi.util.resetApiState());
                }
            },
        }),
    }),
});

export const {
    useGetUserQuery,
    useLazyGetUserQuery,
    useLoginMutation,
    useCheckUsernameExistMutation,
    useRegisterUserMutation,
    useExchangeTokenMutation,
    useLogoutMutation,
} = userApi;
