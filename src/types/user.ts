// src/types/user.ts

export interface User {
    username: string;
    nickname: string;
    email: string;
    social: boolean;
}

export interface ApiResponse<T> {
    timestamp: string;
    requestId: string;
    status: number;
    code: string;
    message: string;
    path: string;
    result: T;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    dpopBound?: boolean;
}
