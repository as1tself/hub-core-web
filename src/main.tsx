// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {Provider} from "react-redux";
import {persistor, store} from "./store/store";
import {PersistGate} from "redux-persist/integration/react";

createRoot(document.getElementById('root')!).render(
// <StrictMode>
    <Provider store={store}>
        <PersistGate loading={<p>불러오는 중...</p>} persistor={persistor}>
            <App />
        </PersistGate>
    </Provider>
// </StrictMode>
)
