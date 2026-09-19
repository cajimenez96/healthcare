import { redirect } from "next/navigation";

import ClinicalNoteForm from "@/components/forms/ClinicalNoteForm";
import { MedicalBackgroundEditor } from "@/components/MedicalBackgroundEditor";
import { Odontogram } from "@/components/Odontogram";
import { getClinicalNotesForPatient } from "@/lib/actions/clinicalNote.actions";
import { getOdontogram } from "@/lib/actions/odontogram.actions";
import { getPatientById } from "@/lib/actions/patient.actions";
import { getActiveTreatments } from "@/lib/actions/treatment.actions";
import { formatDateTime } from "@/lib/utils";

// TASK-070: this page is nested under app/doctor/layout.tsx (RoleLayout),
// which already renders the real navbar (logo + hamburger menu + logout) —
// the page used to also render its own logo+patient-name <header
// className="admin-header">, duplicating that same bar right underneath it.
// Replaced with an actual patient-info panel (name, documento, edad,
// teléfono, obra social, doctor) instead of a second thin nav-style bar.
function calculateAge(birthDate: Date | string): number {
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  return hadBirthdayThisYear ? age : age - 1;
}

const DoctorPatientPage = async (props: SearchParamProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { id } = params;

  const appointmentId = (searchParams?.appointmentId as string) || "";
  const patient = await getPatientById(id);

  if (!patient) {
    redirect("/doctor");
  }

  const notes = await getClinicalNotesForPatient(id);
  const odontogram = await getOdontogram(id);
  const treatments = await getActiveTreatments();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="w-full space-y-4 rounded-md border border-dark-500 bg-dark-400 p-6">
          <div>
            <h1 className="header">{patient.name}</h1>
            <p className="text-14-regular text-dark-700">
              {patient.identificationType ?? "Documento"}:{" "}
              {patient.identificationNumber || "Sin registrar"} ·{" "}
              {calculateAge(patient.birthDate)} años
            </p>
          </div>
          <div className="text-14-regular grid grid-cols-2 gap-2 md:grid-cols-4">
            <p>
              <span className="text-dark-700">Teléfono: </span>
              {patient.phone}
            </p>
            <p>
              <span className="text-dark-700">Obra social: </span>
              {patient.insuranceProvider}
            </p>
            <p>
              <span className="text-dark-700">Doctor: </span>
              {patient.primaryPhysician}
            </p>
            <p>
              <span className="text-dark-700">Nacimiento: </span>
              {formatDateTime(patient.birthDate).dateOnly}
            </p>
          </div>
        </section>

        <section className="w-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="header">Antecedentes médicos</h2>
            <MedicalBackgroundEditor
              patientId={id}
              allergies={patient.allergies}
              currentMedication={patient.currentMedication}
              familyMedicalHistory={patient.familyMedicalHistory}
              pastMedicalHistory={patient.pastMedicalHistory}
            />
          </div>
          <div className="text-14-regular grid grid-cols-2 gap-4">
            <p>
              <span className="text-dark-700">Alergias: </span>
              {patient.allergies || "Sin registrar"}
            </p>
            <p>
              <span className="text-dark-700">Medicación actual: </span>
              {patient.currentMedication || "Sin registrar"}
            </p>
            <p>
              <span className="text-dark-700">Antecedentes familiares: </span>
              {patient.familyMedicalHistory || "Sin registrar"}
            </p>
            <p>
              <span className="text-dark-700">Antecedentes personales: </span>
              {patient.pastMedicalHistory || "Sin registrar"}
            </p>
          </div>
        </section>

        {odontogram && (
          <section className="w-full space-y-4">
            <h2 className="header">Odontograma</h2>
            <Odontogram patientId={id} initialTeeth={odontogram.teeth} />
          </section>
        )}

        {appointmentId && (
          <section className="w-full max-w-lg space-y-4">
            <h2 className="header">Nueva evolución</h2>
            <ClinicalNoteForm
              patientId={id}
              appointmentId={appointmentId}
              treatments={treatments}
            />
          </section>
        )}

        <section className="w-full space-y-4">
          <h2 className="header">Histórico de evoluciones</h2>
          <ul className="space-y-4">
            {notes.map(
              (note: {
                id: string;
                doctorName: string;
                note: string;
                treatments: {
                  treatmentId: string;
                  name: string;
                  price: number;
                }[];
                createdAt: string;
              }) => (
                <li key={note.id} className="border-b border-dark-500 pb-4">
                  <p className="text-12-regular text-dark-700">
                    {formatDateTime(note.createdAt).dateTime} ·{" "}
                    {note.doctorName}
                  </p>
                  <p className="text-14-regular">{note.note}</p>
                  {note.treatments.length > 0 && (
                    <p className="text-12-regular text-dark-700">
                      Prestaciones:{" "}
                      {note.treatments.map((t) => t.name).join(", ")}
                    </p>
                  )}
                </li>
              )
            )}
            {notes.length === 0 && (
              <p className="text-dark-700">
                Todavía no hay evoluciones registradas.
              </p>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default DoctorPatientPage;
