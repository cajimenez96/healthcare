"use client";

import { useState } from "react";

import { DoctorAvatar } from "@/components/DoctorAvatar";
import CreateDoctorAccessForm from "@/components/forms/CreateDoctorAccessForm";
import EditDoctorForm from "@/components/forms/EditDoctorForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setDoctorActive } from "@/lib/actions/doctor.actions";

interface DoctorRowProps {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    licenseNumber: string;
    image?: string;
    isActive: boolean;
    availability: { dayOfWeek: number; startTime: string; endTime: string }[];
  };
}

type RowMode = "view" | "createAccess";

export const DoctorRow = ({ doctor }: DoctorRowProps) => {
  const [mode, setMode] = useState<RowMode>("view");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const toggleActive = async () => {
    setIsToggling(true);
    await setDoctorActive(doctor.id, !doctor.isActive);
    setIsToggling(false);
  };

  if (mode === "createAccess") {
    return (
      <li className="rounded-md border border-dark-500 p-4">
        <CreateDoctorAccessForm
          doctorId={doctor.id}
          onDone={() => setMode("view")}
        />
      </li>
    );
  }

  return (
    <>
      <li className="flex items-center gap-4">
        <DoctorAvatar name={doctor.name} image={doctor.image} size={40} />
        <div className="flex-1">
          <p className="text-14-medium">
            {doctor.name}
            {!doctor.isActive && (
              <span className="text-dark-700"> (inactivo)</span>
            )}
          </p>
          <p className="text-12-regular text-dark-700">
            {doctor.specialty} · {doctor.licenseNumber}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shad-gray-btn"
          onClick={() => setMode("createAccess")}
        >
          Crear acceso
        </Button>
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
          className={doctor.isActive ? "shad-danger-btn" : "shad-primary-btn"}
          disabled={isToggling}
          onClick={toggleActive}
        >
          {doctor.isActive ? "Desactivar" : "Reactivar"}
        </Button>
      </li>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="shad-dialog max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar doctor</DialogTitle>
          </DialogHeader>
          <EditDoctorForm doctor={doctor} onDone={() => setIsEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
