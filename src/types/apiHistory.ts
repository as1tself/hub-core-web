// src/types/apiHistory.ts

export interface ApiHistoryItem {
    seq: number;
    status: number;
    requestId: string;
    accessToken: string;
    code: string;
    message: string;
    path: string;
    clientIp: string;
    result: unknown;
    username: string;
    roles: string;
    ipChain: string[];
    timestamp: string;
    elapsedMs: number;
    requestMethod: string;
}

export interface ApiHistoryPage {
    total: number;
    content: ApiHistoryItem[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
}

export interface ApiHistoryResponse {
    timestamp: string;
    requestId: string;
    status: number;
    code: string;
    message: string;
    path: string;
    result: ApiHistoryPage;
}
