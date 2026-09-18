"use client";

import { useState } from "react";

import TreatmentForm from "@/components/forms/TreatmentForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setTreatmentActive } from "@/lib/actions/treatment.actions";

interface TreatmentRowProps {
  treatment: {
    id: string;
    name: string;
    price: number;
    description?: string;
    isActive: boolean;
    estimatedDurationMinutes: number;
  };
}

export const TreatmentRow = ({ treatment }: TreatmentRowProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const toggleActive = async () => {
    setIsToggling(true);
    await setTreatmentActive(treatment.id, !treatment.isActive);
    setIsToggling(false);
  };

  return (
    <>
      <li className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-14-medium">
            {treatment.name}
            {!treatment.isActive && <span className="text-dark-700"> (inactivo)</span>}
          </p>
          <p className="text-12-regular text-dark-700">
            ${treatment.price.toLocaleString("es-AR")} ·{" "}
            {treatment.estimatedDurationMinutes} min
            {treatment.description ? ` · ${treatment.description}` : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shad-gray-btn"
          onClick={() => setIsEditOpen(true)}
        >
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={treatment.isActive ? "shad-danger-btn" : "shad-primary-btn"}
          isLoading={isToggling}
          onClick={toggleActive}
        >
          {treatment.isActive ? "Desactivar" : "Reactivar"}
        </Button>
      </li>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="shad-dialog sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar prestación</DialogTitle>
          </DialogHeader>
          <TreatmentForm treatment={treatment} onDone={() => setIsEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
