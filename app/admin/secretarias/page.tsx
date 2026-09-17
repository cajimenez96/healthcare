import Image from "next/image";
import Link from "next/link";

import { CreateSecretariaModal } from "@/components/CreateSecretariaModal";
import { SecretariaRow } from "@/components/SecretariaRow";
import { getSecretarias } from "@/lib/actions/secretaria.actions";

const SecretariasPage = async () => {
  const secretarias = await getSecretarias();

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

        <p className="text-16-semibold">Secretarías</p>
        <Link href="/admin" className="text-green-500">
          Volver
        </Link>
      </header>

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
