"use client";

import { useState } from "react";

import EditAdminForm from "@/components/forms/EditAdminForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setAdminActive } from "@/lib/actions/adminUser.actions";

interface AdminRowProps {
  admin: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}

export const AdminRow = ({ admin }: AdminRowProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
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
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="shad-gray-btn">
            Editar
          </Button>
        </DialogTrigger>
        <DialogContent className="shad-dialog sm:max-w-md">
          <DialogHeader className="mb-4">
            <DialogTitle>Editar administrador</DialogTitle>
          </DialogHeader>
          <EditAdminForm admin={admin} onDone={() => setIsEditOpen(false)} />
        </DialogContent>
      </Dialog>
      <Button
        variant="outline"
        size="sm"
        className={admin.isActive ? "shad-danger-btn" : "shad-primary-btn"}
        isLoading={isToggling}
        onClick={toggleActive}
      >
        {admin.isActive ? "Desactivar" : "Reactivar"}
      </Button>
    </li>
  );
};
