import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout/AuthLayout";
import { AppLayout } from "../layouts/AppLayout/AppLayout";
import { LoginPage } from "../pages/Login/LoginPage"; 

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <div style={{ padding: 16 }}>Home (placeholder)</div> },
    ],
  },
]);
