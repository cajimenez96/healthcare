"use client";

import { Appointment } from "@/types/appwrite.types";

import { getColumns } from "./columns";
import { DataTable } from "./DataTable";

type DoctorOption = { name: string; image: string };

interface AppointmentsTableProps {
  data: Appointment[];
  allDoctors: DoctorOption[];
  activeDoctors: DoctorOption[];
}

// Building the columns (they render <AppointmentModal>, a client component)
// must happen entirely on the client. app/admin/page.tsx is a Server
// Component, and calling a plain function exported from a "use client"
// module (columns.tsx) directly from server code crosses the RSC boundary
// in a way Next.js doesn't reliably support — it can work against a fresh
// compile and break against a cached/reused one. This wrapper keeps that
// call inside client-component code; the Server Component only ever passes
// plain, serializable props down.
export function AppointmentsTable({
  data,
  allDoctors,
  activeDoctors,
}: AppointmentsTableProps) {
  const columns = getColumns(allDoctors, activeDoctors);

  return <DataTable columns={columns} data={data} />;
}
