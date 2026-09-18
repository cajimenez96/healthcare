import { CreateDoctorModal } from "@/components/CreateDoctorModal";
import { DoctorRow } from "@/components/DoctorRow";
import { getAllDoctors } from "@/lib/actions/doctor.actions";

const DoctorsPage = async () => {
  const doctors = await getAllDoctors();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="header">Doctores</h1>
            <CreateDoctorModal />
          </div>
          <ul className="space-y-4">
            {doctors.map(
              (doctor: {
                id: string;
                name: string;
                specialty: string;
                licenseNumber: string;
                image?: string;
                isActive: boolean;
                availability: {
                  dayOfWeek: number;
                  startTime: string;
                  endTime: string;
                }[];
              }) => (
                <DoctorRow key={doctor.id} doctor={doctor} />
              ),
            )}
            {doctors.length === 0 && (
              <p className="text-dark-700">Todavía no hay doctores cargados.</p>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default DoctorsPage;
