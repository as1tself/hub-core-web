// src/store/apis/apiHistoryApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";
import type { ApiHistoryResponse, ApiHistoryPage } from "../../types/apiHistory";

export const apiHistoryApi = createApi({
    reducerPath: "apiHistoryApi",
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        getApiHistory: builder.query<ApiHistoryPage, { page: number; size: number; sort?: string; search?: string }>({
            query: ({ page, size, sort, search }) => {
                const params = new URLSearchParams();
                params.append("page", String(page));
                params.append("size", String(size));
                if (sort) params.append("sort", sort);
                if (search) params.append("search", search);
                return {
                    url: `/user/api/history?${params.toString()}`,
                    method: "GET",
                    credentials: "include",
                };
            },
            transformResponse: (res: ApiHistoryResponse) => res.result,
        }),
    }),
});

export const { useGetApiHistoryQuery } = apiHistoryApi;
