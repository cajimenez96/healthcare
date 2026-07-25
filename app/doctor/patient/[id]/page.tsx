import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import ClinicalNoteForm from "@/components/forms/ClinicalNoteForm";
import { Odontogram } from "@/components/Odontogram";
import { getClinicalNotesForPatient } from "@/lib/actions/clinicalNote.actions";
import { getOdontogram } from "@/lib/actions/odontogram.actions";
import { getPatientById } from "@/lib/actions/patient.actions";
import { getActiveTreatments } from "@/lib/actions/treatment.actions";
import { formatDateTime } from "@/lib/utils";

const DoctorPatientPage = async (props: SearchParamProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const {
    id
  } = params;

  const appointmentId = (searchParams?.appointmentId as string) || "";
  const patient = await getPatientById(id);

  if (!patient) {
    redirect("/doctor");
  }

  const notes = await getClinicalNotesForPatient(id);
  const odontogram = await getOdontogram(id);
  const treatments = await getActiveTreatments();

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-14">
      <header className="admin-header">
        <Link href="/doctor" className="cursor-pointer">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit"
          />
        </Link>

        <p className="text-16-semibold">{patient.name}</p>
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4">
          <h1 className="header">Antecedentes médicos</h1>
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
                treatments: { treatmentId: string; name: string; price: number }[];
                createdAt: string;
              }) => (
                <li key={note.id} className="border-b border-dark-500 pb-4">
                  <p className="text-12-regular text-dark-700">
                    {formatDateTime(note.createdAt).dateTime} · {note.doctorName}
                  </p>
                  <p className="text-14-regular">{note.note}</p>
                  {note.treatments.length > 0 && (
                    <p className="text-12-regular text-dark-700">
                      Prestaciones: {note.treatments.map((t) => t.name).join(", ")}
                    </p>
                  )}
                </li>
              ),
            )}
            {notes.length === 0 && (
              <p className="text-dark-700">Todavía no hay evoluciones registradas.</p>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default DoctorPatientPage;
