"use client";

import { useState } from "react";

import EditSecretariaForm from "@/components/forms/EditSecretariaForm";
import { Button } from "@/components/ui/button";
import { setSecretariaActive } from "@/lib/actions/secretaria.actions";

interface SecretariaRowProps {
  secretaria: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}

type RowMode = "view" | "edit";

export const SecretariaRow = ({ secretaria }: SecretariaRowProps) => {
  const [mode, setMode] = useState<RowMode>("view");
  const [isToggling, setIsToggling] = useState(false);

  const toggleActive = async () => {
    setIsToggling(true);
    await setSecretariaActive(secretaria.id, !secretaria.isActive);
    setIsToggling(false);
  };

  if (mode === "edit") {
    return (
      <li className="rounded-md border border-dark-500 p-4">
        <EditSecretariaForm secretaria={secretaria} onDone={() => setMode("view")} />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-4">
      <div className="flex-1">
        <p className="text-14-medium">
          {secretaria.name}
          {!secretaria.isActive && (
            <span className="text-dark-700"> (inactiva)</span>
          )}
        </p>
        <p className="text-12-regular text-dark-700">{secretaria.email}</p>
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
        className={secretaria.isActive ? "shad-danger-btn" : "shad-primary-btn"}
        disabled={isToggling}
        onClick={toggleActive}
      >
        {secretaria.isActive ? "Desactivar" : "Reactivar"}
      </Button>
    </li>
  );
};
