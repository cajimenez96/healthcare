import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { DEFAULT_INSURANCE_PROVIDER } from "../constants";
import { connectToDatabase } from "../lib/db/mongodb";
import { MongoInsuranceProviderRepository } from "../lib/db/repositories/MongoInsuranceProviderRepository";
import { MongoTreatmentRepository } from "../lib/db/repositories/MongoTreatmentRepository";

const BASE_TREATMENTS = [
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

async function main() {
  await connectToDatabase();

  const insuranceProviderRepository = new MongoInsuranceProviderRepository();
  const treatmentRepository = new MongoTreatmentRepository();

  const particular = await insuranceProviderRepository.create(
    DEFAULT_INSURANCE_PROVIDER,
  );
  console.log(`Obra Social "${DEFAULT_INSURANCE_PROVIDER}" lista (id: ${particular.id}).`);

  const existingTreatments = await treatmentRepository.findAll();
  const existingNames = new Set(existingTreatments.map((t) => t.name));

  for (const treatment of BASE_TREATMENTS) {
    if (existingNames.has(treatment.name)) {
      console.log(`Prestación "${treatment.name}" ya existe, se omite.`);
      continue;
    }
    const created = await treatmentRepository.create(treatment);
    console.log(`Prestación "${created.name}" creada (id: ${created.id}).`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to seed nomenclador:", error.message);
  process.exit(1);
});
