"use client";

import { useState } from "react";

import DoctorForm from "@/components/forms/DoctorForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const CreateDoctorModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shad-primary-btn">
          Crear Doctor
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alta de doctor</DialogTitle>
        </DialogHeader>
        <DoctorForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
