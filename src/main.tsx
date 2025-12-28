// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { Provider } from "react-redux";
import { persistor, store } from "./store";
import { PersistGate } from "redux-persist/integration/react";
import { ErrorBoundary } from "./components";

createRoot(document.getElementById('root')!).render(
// <StrictMode>
    <ErrorBoundary>
        <Provider store={store}>
            <PersistGate loading={<p>불러오는 중...</p>} persistor={persistor}>
                <App />
            </PersistGate>
        </Provider>
    </ErrorBoundary>
// </StrictMode>
)
