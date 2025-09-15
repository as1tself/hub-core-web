// src/store/userApi.ts
import {createApi} from "@reduxjs/toolkit/query/react";
import {baseQueryWithReauth} from "./baseQueryWithReauth";

export type User = {
    username: string; nickname: string; email: string; social: boolean;
};

export type ApiResponse<T> = {
    timestamp: string; requestId: string; status: number; code: string; message: string; path: string; result: T;
};

export const userApi = createApi({
    reducerPath: "userApi", baseQuery: baseQueryWithReauth, endpoints: (builder) => ({
        getUser: builder.query<User, void>({
            query: () => ({
                url: "/user", method: "GET", credentials: "include",
            }), transformResponse: (response: ApiResponse<User>) => response.result,
        }),
    }),
});

export const {useGetUserQuery} = userApi;
