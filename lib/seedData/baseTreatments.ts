// Pure data, no side effects — safe to import from both the CLI seeder
// (scripts/seed-nomenclador.ts) and the Playwright global setup
// (e2e/global-setup.ts) without triggering either one's side effects.
export const BASE_TREATMENTS = [
  {
    name: "Consulta Odontológica",
    price: 5000,
    description: "Consulta y diagnóstico inicial",
  },
  {
    name: "Obturación de Resina",
    price: 15000,
    description: "Obturación (tapado de caries) con resina compuesta",
  },
  {
    name: "Limpieza Dental",
    price: 8000,
    description: "Profilaxis y limpieza dental",
  },
];
