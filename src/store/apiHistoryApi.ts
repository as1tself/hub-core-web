// src/store/apiHistoryApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth.ts";
import type { ApiHistoryResponse, ApiHistoryPage } from "../types/apiHistory";

export const apiHistoryApi = createApi({
    reducerPath: "apiHistoryApi",
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        getApiHistory: builder.query<ApiHistoryPage, { page: number; size: number }>({
            query: ({ page, size }) => ({
                url: `/user/api/history?page=${page}&size=${size}`,
                method: "GET",
                credentials: "include",
            }),
            transformResponse: (res: ApiHistoryResponse) => res.result,
        }),
    }),
});

export const { useGetApiHistoryQuery } = apiHistoryApi;
