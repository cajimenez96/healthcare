"use client";

import Image from "next/image";
import { useState } from "react";

import CreateDoctorAccessForm from "@/components/forms/CreateDoctorAccessForm";
import EditDoctorForm from "@/components/forms/EditDoctorForm";
import { Button } from "@/components/ui/button";
import { setDoctorActive } from "@/lib/actions/doctor.actions";

interface DoctorRowProps {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    licenseNumber: string;
    image: string;
    isActive: boolean;
    availability: { dayOfWeek: number; startTime: string; endTime: string }[];
  };
}

type RowMode = "view" | "edit" | "createAccess";

export const DoctorRow = ({ doctor }: DoctorRowProps) => {
  const [mode, setMode] = useState<RowMode>("view");
  const [isToggling, setIsToggling] = useState(false);

  const toggleActive = async () => {
    setIsToggling(true);
    await setDoctorActive(doctor.id, !doctor.isActive);
    setIsToggling(false);
  };

  if (mode === "edit") {
    return (
      <li className="rounded-md border border-dark-500 p-4">
        <EditDoctorForm doctor={doctor} onDone={() => setMode("view")} />
      </li>
    );
  }

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
    <li className="flex items-center gap-4">
      <Image
        src={doctor.image}
        alt={doctor.name}
        width={40}
        height={40}
        className="rounded-full border border-dark-500"
      />
      <div className="flex-1">
        <p className="text-14-medium">
          {doctor.name}
          {!doctor.isActive && (
            <span className="text-dark-700"> (inactivo)</span>
          )}
        </p>
        <p className="text-dark-700 text-12-regular">
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
        onClick={() => setMode("edit")}
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
  );
};
