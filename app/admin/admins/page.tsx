import { AdminRow } from "@/components/AdminRow";
import { CreateAdminModal } from "@/components/CreateAdminModal";
import { getAdmins } from "@/lib/actions/adminUser.actions";

const AdminsPage = async () => {
  const admins = await getAdmins();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="header">Administradores</h1>
            <CreateAdminModal />
          </div>
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
      </main>
    </div>
  );
};

export default AdminsPage;
