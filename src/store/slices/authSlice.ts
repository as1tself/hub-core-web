// src/store/slices/authSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EncryptedToken } from "../../lib/dpop";

/**
 * Auth State
 *
 * ## 토큰 암호화 저장
 * accessToken은 DPoP 개인키로 파생된 AES 키로 암호화되어 저장됩니다.
 * - XSS 공격자가 Redux에서 토큰을 추출해도 암호화되어 있음
 * - 복호화에는 DPoP 개인키가 필요하지만 extractable: false
 * - → 공격자는 토큰을 사용할 수 없음
 */
interface AuthState {
    /** 암호화된 Access Token (DPoP 키로 암호화됨) */
    encryptedAccessToken: EncryptedToken | null;
}

const initialState: AuthState = {
    encryptedAccessToken: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        /**
         * 암호화된 토큰 저장
         * - 반드시 dpopClient.encryptToken()으로 암호화한 후 저장할 것
         */
        setEncryptedAccessToken: (state, action: PayloadAction<EncryptedToken>) => {
            state.encryptedAccessToken = action.payload;
        },
        clearAccessToken: (state) => {
            state.encryptedAccessToken = null;
        },
    },
});

export const { setEncryptedAccessToken, clearAccessToken } = authSlice.actions;
export default authSlice.reducer;
