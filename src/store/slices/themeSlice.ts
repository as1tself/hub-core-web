import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
    mode: ThemeMode;
    resolvedTheme: "light" | "dark";
}

const getSystemTheme = (): "light" | "dark" => {
    if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
};

const getSavedTheme = (): ThemeMode => {
    if (typeof window !== "undefined") {
        const saved = localStorage.getItem("theme");
        if (saved === "light" || saved === "dark" || saved === "system") {
            return saved;
        }
    }
    return "system";
};

const resolveTheme = (mode: ThemeMode): "light" | "dark" => {
    if (mode === "system") {
        return getSystemTheme();
    }
    return mode;
};

const initialMode = getSavedTheme();

const initialState: ThemeState = {
    mode: initialMode,
    resolvedTheme: resolveTheme(initialMode),
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<ThemeMode>) => {
            state.mode = action.payload;
            state.resolvedTheme = resolveTheme(action.payload);
            localStorage.setItem("theme", action.payload);
            document.documentElement.setAttribute("data-theme", state.resolvedTheme);
        },
        toggleTheme: (state) => {
            const newTheme = state.resolvedTheme === "light" ? "dark" : "light";
            state.mode = newTheme;
            state.resolvedTheme = newTheme;
            localStorage.setItem("theme", newTheme);
            document.documentElement.setAttribute("data-theme", newTheme);
        },
        syncWithSystem: (state) => {
            if (state.mode === "system") {
                state.resolvedTheme = getSystemTheme();
                document.documentElement.setAttribute("data-theme", state.resolvedTheme);
            }
        },
        initializeTheme: (state) => {
            document.documentElement.setAttribute("data-theme", state.resolvedTheme);
            // 테마 적용 후 transition 활성화 (깜빡임 방지)
            requestAnimationFrame(() => {
                document.documentElement.classList.remove("theme-loading");
            });
        },
    },
});

export const { setTheme, toggleTheme, syncWithSystem, initializeTheme } = themeSlice.actions;
export default themeSlice.reducer;
