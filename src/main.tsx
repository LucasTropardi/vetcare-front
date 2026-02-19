import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Naming } from "./i18n/naming";
import "./styles/global.css";
import { router } from "./app/router";
import { RouterProvider } from 'react-router-dom';
import { AuthBootstrap } from './Bootstrap';
import { OidcAuthProvider } from "./auth/OidcAuthProvider";

Naming.init();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OidcAuthProvider>
      <RouterProvider router={router} />
      <AuthBootstrap />
    </OidcAuthProvider>
  </StrictMode>,
)
