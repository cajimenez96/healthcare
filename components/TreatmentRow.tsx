"use client";

import { useState } from "react";

import TreatmentForm from "@/components/forms/TreatmentForm";
import { Button } from "@/components/ui/button";
import { setTreatmentActive } from "@/lib/actions/treatment.actions";

interface TreatmentRowProps {
  treatment: {
    id: string;
    name: string;
    price: number;
    description?: string;
    isActive: boolean;
  };
}

export const TreatmentRow = ({ treatment }: TreatmentRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const toggleActive = async () => {
    setIsToggling(true);
    await setTreatmentActive(treatment.id, !treatment.isActive);
    setIsToggling(false);
  };

  if (isEditing) {
    return (
      <li className="rounded-md border border-dark-500 p-4">
        <TreatmentForm treatment={treatment} onDone={() => setIsEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-4">
      <div className="flex-1">
        <p className="text-14-medium">
          {treatment.name}
          {!treatment.isActive && <span className="text-dark-700"> (inactivo)</span>}
        </p>
        <p className="text-12-regular text-dark-700">
          ${treatment.price.toLocaleString("es-AR")}
          {treatment.description ? ` · ${treatment.description}` : ""}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shad-gray-btn"
        onClick={() => setIsEditing(true)}
      >
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={treatment.isActive ? "shad-danger-btn" : "shad-primary-btn"}
        disabled={isToggling}
        onClick={toggleActive}
      >
        {treatment.isActive ? "Desactivar" : "Reactivar"}
      </Button>
    </li>
  );
};
