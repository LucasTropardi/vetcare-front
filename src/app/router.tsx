import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout/AuthLayout";
import { AppLayout } from "../layouts/AppLayout/AppLayout";
import { LoginPage } from "../pages/Login/LoginPage";
import { RequireAuth } from "./RequireAuth"; 
import { HomePage } from "../pages/Home/HomePage";
import { UsersPage } from "../pages/Users/UsersPage";
import { TutorsPage } from "../pages/Tutors/TutorsPage";
import { PetsPage } from "../pages/Pets/PetsPage";
import { CustomerCompaniesPage } from "../pages/CustomerCompanies/CustomerCompaniesPage";
import { CompanyProfilePage } from "../pages/CompanyProfile/CompanyProfilePage";
import { ProductsPage } from "../pages/Products/ProductsPage";
import { StockBalancesPage } from "../pages/Stock/StockBalancesPage";
import { StockMovementsPage } from "../pages/Stock/StockMovementsPage";
import { StockNewMovementPage } from "../pages/Stock/StockNewMovementPage";
import { StockProductDetailPage } from "../pages/Stock/StockProductDetailPage";
import { FinancePage } from "../pages/Finance/FinancePage";
import { ReportsPage } from "../pages/Reports/ReportsPage";

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
      {  path: "/users", element: <UsersPage />},
      {  path: "/tutors", element: <TutorsPage />},
      {  path: "/pets", element: <PetsPage />},
      { path: "/products", element: <ProductsPage /> },
      { path: "/customer-companies", element: <CustomerCompaniesPage /> },
      { path: "/company-profile", element: <CompanyProfilePage /> },
      { path: "/stock/balances", element: <StockBalancesPage /> },
      { path: "/stock/movements", element: <StockMovementsPage /> },
      { path: "/stock/new-movement", element: <StockNewMovementPage /> },
      { path: "/stock/product-view", element: <StockProductDetailPage /> },
      { path: "/finance", element: <FinancePage /> },
      { path: "/reports", element: <ReportsPage /> },
    ],
  },
]);
