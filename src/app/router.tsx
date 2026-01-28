import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout/AuthLayout";
import { AppLayout } from "../layouts/AppLayout/AppLayout";
import { LoginPage } from "../pages/Login/LoginPage";
import { RequireAuth } from "./RequireAuth"; 
import { HomePage } from "../pages/Home/HomePage";
import { UsersPage } from "../pages/Users/UsersPage";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: "/", element: <HomePage /> },
      {  path: "/users", element: <UsersPage />}
    ],
  },
]);
