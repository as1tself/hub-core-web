// src/providers/DPoPProvider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dpopClient } from "../lib/dpop";

interface DPoPContextType {
    isReady: boolean;
    createProof: (method: string, url: string) => Promise<string>;
    clearKeyPair: () => Promise<void>;
}

const DPoPContext = createContext<DPoPContextType | null>(null);

interface DPoPProviderProps {
    children: ReactNode;
}

export function DPoPProvider({ children }: DPoPProviderProps) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        dpopClient.init().then(() => {
            setIsReady(true);
        }).catch((error) => {
            console.error("[DPoP] 초기화 실패:", error);
            // 실패해도 앱은 계속 동작하도록 (fallback)
            setIsReady(true);
        });
    }, []);

    const value: DPoPContextType = {
        isReady,
        createProof: (method: string, url: string) => dpopClient.createProof(method, url),
        clearKeyPair: () => dpopClient.clearKeyPair(),
    };

    return (
        <DPoPContext.Provider value={value}>
            {children}
        </DPoPContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDPoP(): DPoPContextType {
    const context = useContext(DPoPContext);
    if (!context) {
        throw new Error("useDPoP must be used within a DPoPProvider");
    }
    return context;
}
