import Image from "next/image";
import Link from "next/link";

const UnauthorizedPage = () => {
  return (
    <div className="flex h-screen max-h-screen items-center justify-center">
      <div className="sub-container max-w-[496px] text-center">
        <Image
          src="/assets/icons/logo-full.svg"
          height={1000}
          width={1000}
          alt="clinic"
          className="mx-auto mb-12 h-10 w-fit"
        />
        <h1 className="header mb-4">Acceso no autorizado</h1>
        <p className="text-dark-700 mb-8">
          Tu usuario no tiene permiso para acceder a esta página.
        </p>
        <Link href="/login" className="text-green-500">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
