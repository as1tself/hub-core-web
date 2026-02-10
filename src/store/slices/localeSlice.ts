// src/store/slices/localeSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type LocaleMode = "system" | "ko" | "en";
export type ResolvedLocale = "ko" | "en";

interface LocaleState {
    mode: LocaleMode;
    resolvedLocale: ResolvedLocale;
}

// 브라우저 언어 감지
const getSystemLocale = (): ResolvedLocale => {
    if (typeof window !== "undefined" && navigator.language) {
        const lang = navigator.language.toLowerCase();
        if (lang.startsWith("ko")) return "ko";
    }
    return "en";
};

// localStorage에서 저장된 설정 불러오기
const getSavedLocale = (): LocaleMode => {
    if (typeof window !== "undefined") {
        const saved = localStorage.getItem("locale");
        if (saved === "ko" || saved === "en" || saved === "system") {
            return saved;
        }
    }
    return "system";
};

// 모드에 따른 실제 언어 결정
const resolveLocale = (mode: LocaleMode): ResolvedLocale => {
    if (mode === "system") {
        return getSystemLocale();
    }
    return mode;
};

const initialMode = getSavedLocale();

const initialState: LocaleState = {
    mode: initialMode,
    resolvedLocale: resolveLocale(initialMode),
};

const localeSlice = createSlice({
    name: "locale",
    initialState,
    reducers: {
        setLocale: (state, action: PayloadAction<LocaleMode>) => {
            state.mode = action.payload;
            state.resolvedLocale = resolveLocale(action.payload);
            localStorage.setItem("locale", action.payload);
            document.documentElement.setAttribute("lang", state.resolvedLocale);
        },
        toggleLocale: (state) => {
            const newLocale: ResolvedLocale = state.resolvedLocale === "ko" ? "en" : "ko";
            state.mode = newLocale;
            state.resolvedLocale = newLocale;
            localStorage.setItem("locale", newLocale);
            document.documentElement.setAttribute("lang", newLocale);
        },
        syncWithSystem: (state) => {
            if (state.mode === "system") {
                state.resolvedLocale = getSystemLocale();
                document.documentElement.setAttribute("lang", state.resolvedLocale);
            }
        },
        initializeLocale: (state) => {
            document.documentElement.setAttribute("lang", state.resolvedLocale);
        },
    },
});

export const { setLocale, toggleLocale, syncWithSystem, initializeLocale } = localeSlice.actions;
export default localeSlice.reducer;
