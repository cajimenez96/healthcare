interface PatientRowProps {
  patient: {
    $id: string;
    name: string;
    email: string;
    phone: string;
    identificationType?: string;
    identificationNumber?: string;
  };
}

// List-only row for the patient list/filter screen (TASK-035) — no
// edit/delete action, unlike DoctorRow/TreatmentRow/SecretariaRow/AdminRow:
// there is nothing to edit from this screen, patient edition is out of scope.
export const PatientRow = ({ patient }: PatientRowProps) => {
  const identification = patient.identificationNumber
    ? `${patient.identificationType ?? "Documento"}: ${patient.identificationNumber}`
    : "Sin documento registrado";

  return (
    <li className="flex items-center gap-4 rounded-md border border-dark-500 p-4">
      <div className="flex-1 space-y-1">
        <p className="text-14-medium">{patient.name}</p>
        <p className="text-12-regular text-dark-700">
          {identification} · {patient.phone} · {patient.email}
        </p>
      </div>
    </li>
  );
};
