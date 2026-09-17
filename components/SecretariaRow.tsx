"use client";

import { useState } from "react";

import EditSecretariaForm from "@/components/forms/EditSecretariaForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setSecretariaActive } from "@/lib/actions/secretaria.actions";

interface SecretariaRowProps {
  secretaria: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}

export const SecretariaRow = ({ secretaria }: SecretariaRowProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const toggleActive = async () => {
    setIsToggling(true);
    await setSecretariaActive(secretaria.id, !secretaria.isActive);
    setIsToggling(false);
  };

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
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="shad-gray-btn">
            Editar
          </Button>
        </DialogTrigger>
        <DialogContent className="shad-dialog sm:max-w-md">
          <DialogHeader className="mb-4">
            <DialogTitle>Editar secretaría</DialogTitle>
          </DialogHeader>
          <EditSecretariaForm
            secretaria={secretaria}
            onDone={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
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
