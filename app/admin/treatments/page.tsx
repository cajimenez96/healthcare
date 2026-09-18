import { CreateTreatmentModal } from "@/components/CreateTreatmentModal";
import { TreatmentRow } from "@/components/TreatmentRow";
import { getAllTreatments } from "@/lib/actions/treatment.actions";

const TreatmentsPage = async () => {
  const treatments = await getAllTreatments();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="header">Prestaciones</h1>
            <CreateTreatmentModal />
          </div>
          <ul className="space-y-4">
            {treatments.map(
              (treatment: {
                id: string;
                name: string;
                price: number;
                description?: string;
                isActive: boolean;
                estimatedDurationMinutes: number;
              }) => (
                <TreatmentRow key={treatment.id} treatment={treatment} />
              ),
            )}
            {treatments.length === 0 && (
              <p className="text-dark-700">
                Todavía no hay prestaciones cargadas. Corré{" "}
                <code>pnpm db:seed-nomenclador</code> o cargá una manualmente.
              </p>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default TreatmentsPage;
