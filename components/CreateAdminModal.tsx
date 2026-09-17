"use client";

import { useState } from "react";

import CreateAdminForm from "@/components/forms/CreateAdminForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const CreateAdminModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shad-primary-btn">
          Crear Administrador
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog sm:max-w-md">
        <DialogHeader className="mb-4">
          <DialogTitle>Alta de administrador</DialogTitle>
        </DialogHeader>
        <CreateAdminForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
};
