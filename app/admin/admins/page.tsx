import Image from "next/image";
import Link from "next/link";

import { AdminRow } from "@/components/AdminRow";
import CreateAdminForm from "@/components/forms/CreateAdminForm";
import { getAdmins } from "@/lib/actions/adminUser.actions";

const AdminsPage = async () => {
  const admins = await getAdmins();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <header className="admin-header">
        <Link href="/admin" className="cursor-pointer">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit"
          />
        </Link>

        <p className="text-16-semibold">Administradores</p>
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4">
          <h1 className="header">Administradores</h1>
          <ul className="space-y-4">
            {admins.map(
              (admin: {
                id: string;
                name: string;
                email: string;
                isActive?: boolean;
              }) => (
                <AdminRow
                  key={admin.id}
                  admin={{
                    ...admin,
                    isActive: admin.isActive !== false,
                  }}
                />
              ),
            )}
            {admins.length === 0 && (
              <p className="text-dark-700">Todavía no hay administradores cargados.</p>
            )}
          </ul>
        </section>

        <section className="w-full max-w-lg space-y-4">
          <h2 className="header">Alta de administrador</h2>
          <CreateAdminForm />
        </section>
      </main>
    </div>
  );
};

export default AdminsPage;
