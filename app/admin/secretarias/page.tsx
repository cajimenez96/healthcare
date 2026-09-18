import { CreateSecretariaModal } from "@/components/CreateSecretariaModal";
import { SecretariaRow } from "@/components/SecretariaRow";
import { getSecretarias } from "@/lib/actions/secretaria.actions";

const SecretariasPage = async () => {
  const secretarias = await getSecretarias();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="header">Secretarías</h1>
            <CreateSecretariaModal />
          </div>
          <ul className="space-y-4">
            {secretarias.map(
              (secretaria: {
                id: string;
                name: string;
                email: string;
                isActive?: boolean;
              }) => (
                <SecretariaRow
                  key={secretaria.id}
                  secretaria={{
                    ...secretaria,
                    isActive: secretaria.isActive !== false,
                  }}
                />
              ),
            )}
            {secretarias.length === 0 && (
              <p className="text-dark-700">Todavía no hay secretarías cargadas.</p>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default SecretariasPage;
