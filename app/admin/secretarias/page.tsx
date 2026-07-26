import Image from "next/image";
import Link from "next/link";

import CreateSecretariaForm from "@/components/forms/CreateSecretariaForm";
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
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4">
          <h1 className="header">Secretarías</h1>
          <ul className="space-y-4">
            {secretarias.map((secretaria: { id: string; name: string; email: string }) => (
              <li key={secretaria.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-14-medium">{secretaria.name}</p>
                  <p className="text-12-regular text-dark-700">{secretaria.email}</p>
                </div>
              </li>
            ))}
            {secretarias.length === 0 && (
              <p className="text-dark-700">Todavía no hay secretarías cargadas.</p>
            )}
          </ul>
        </section>

        <section className="w-full max-w-lg space-y-4">
          <h2 className="header">Alta de secretaría</h2>
          <CreateSecretariaForm />
        </section>
      </main>
    </div>
  );
};

export default SecretariasPage;
