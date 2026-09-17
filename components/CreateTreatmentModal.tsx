"use client";

import { useState } from "react";

import TreatmentForm from "@/components/forms/TreatmentForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const CreateTreatmentModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shad-primary-btn">
          Crear Prestación
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva prestación</DialogTitle>
        </DialogHeader>
        <TreatmentForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
