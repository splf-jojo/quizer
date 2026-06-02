import { FilePlus2, ListChecks, LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import AdminLoginPage from "./AdminLoginPage.jsx";

export default function AdminProtectedLayout() {
  const { logout, token } = useAuth();
  const { t } = useLanguage();

  if (!token) {
    return <AdminLoginPage />;
  }

  const navItems = [
    { label: t("createTest"), to: "/admin/create", icon: FilePlus2 },
    { label: t("tests"), to: "/admin", icon: ListChecks, end: true }
  ];

  return (
    <main className="page-shell min-h-screen">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="flex w-full flex-col border-b border-zinc-200 bg-white px-4 py-4 md:w-64 md:border-b-0 md:border-r md:px-5 md:py-6">
          <nav className="flex flex-col gap-2" aria-label={t("adminNavigation")}>
            {navItems.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  }`
                }
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <Button
            className="mt-4 w-full justify-start md:mt-auto"
            variant="ghost"
            onClick={logout}
            title={t("logout")}
          >
            <LogOut size={17} aria-hidden="true" />
            {t("logout")}
          </Button>
        </aside>

        <section className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
}
