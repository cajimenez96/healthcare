"use client";

import { useState } from "react";

import CreateSecretariaForm from "@/components/forms/CreateSecretariaForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const CreateSecretariaModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shad-primary-btn">
          Crear Secretaria
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog sm:max-w-md">
        <DialogHeader className="mb-4">
          <DialogTitle>Alta de secretaría</DialogTitle>
        </DialogHeader>
        <CreateSecretariaForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
};
