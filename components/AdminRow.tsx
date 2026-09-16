"use client";

import { useState } from "react";

import EditAdminForm from "@/components/forms/EditAdminForm";
import { Button } from "@/components/ui/button";
import { setAdminActive } from "@/lib/actions/adminUser.actions";

interface AdminRowProps {
  admin: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}

type RowMode = "view" | "edit";

export const AdminRow = ({ admin }: AdminRowProps) => {
  const [mode, setMode] = useState<RowMode>("view");
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleActive = async () => {
    setIsToggling(true);
    setError(null);

    const result = await setAdminActive(admin.id, !admin.isActive);

    setIsToggling(false);

    if (result && "error" in result) {
      setError(
        result.error === "LAST_ADMIN"
          ? "No se puede desactivar al último Administrador activo."
          : "No se pudo cambiar el estado. Intentá de nuevo.",
      );
    }
  };

  if (mode === "edit") {
    return (
      <li className="rounded-md border border-dark-500 p-4">
        <EditAdminForm admin={admin} onDone={() => setMode("view")} />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-4">
      <div className="flex-1">
        <p className="text-14-medium">
          {admin.name}
          {!admin.isActive && <span className="text-dark-700"> (inactivo)</span>}
        </p>
        <p className="text-12-regular text-dark-700">{admin.email}</p>
        {error && <p className="shad-error text-12-regular">{error}</p>}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shad-gray-btn"
        onClick={() => setMode("edit")}
      >
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={admin.isActive ? "shad-danger-btn" : "shad-primary-btn"}
        disabled={isToggling}
        onClick={toggleActive}
      >
        {admin.isActive ? "Desactivar" : "Reactivar"}
      </Button>
    </li>
  );
};
