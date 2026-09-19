"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusLabels } from "@/constants";
import { listAppointments } from "@/lib/actions/appointment.actions";
import { Appointment } from "@/types/appwrite.types";

import { getColumns } from "./columns";
import { DataTable } from "./DataTable";

type DoctorOption = { name: string; image?: string };

interface AppointmentsTableProps {
  data: Appointment[];
  allDoctors: DoctorOption[];
  activeDoctors: DoctorOption[];
  // TASK-063: the unified turnos list route, shared by /admin/turnos and
  // /recepcion/turnos — forwarded to getColumns so "Reagendar" links back
  // into whichever role's route this table is rendered under.
  basePath: string;
}

// The 4 real Status values (types/index.d.ts) with their existing Spanish
// labels (constants.ts's StatusLabels, TASK-022) — reused rather than
// reinvented, same as StatusBadge already does.
const STATUS_OPTIONS: Status[] = [
  "pending",
  "scheduled",
  "cancelled",
  "completed",
];

// Sentinel for "no filter" in the doctor/estado <Select>s — Radix's Select
// doesn't accept an empty string as an item value, so "all" stands in for
// "don't filter on this" and is translated back to `undefined` before the
// filters are sent to listAppointments.
const ALL = "all";

// Building the columns (they render <AppointmentModal>, a client component)
// must happen entirely on the client. app/admin/page.tsx is a Server
// Component, and calling a plain function exported from a "use client"
// module (columns.tsx) directly from server code crosses the RSC boundary
// in a way Next.js doesn't reliably support — it can work against a fresh
// compile and break against a cached/reused one. This wrapper keeps that
// call inside client-component code; the Server Component only ever passes
// plain, serializable props down.
//
// TASK-054: also owns the dashboard's turnos filters (fecha/paciente/
// doctor/estado, combinable with AND) — same form shape and server-side
// re-query-on-submit pattern as PatientsList's filters (TASK-035): each
// "Buscar" call replaces `appointments` with a fresh `listAppointments()`
// result instead of filtering the initial `data` prop in the browser.
// getRecentAppointmentList's findRecent() already has no "last N" limit
// (it fetches every appointment, newest first), so there's no pagination
// story being displaced by this — filtering just narrows the same
// already-unbounded query.
export function AppointmentsTable({
  data,
  allDoctors,
  activeDoctors,
  basePath,
}: AppointmentsTableProps) {
  const [appointments, setAppointments] = useState(data);
  const [date, setDate] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [doctor, setDoctor] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [isSearching, setIsSearching] = useState(false);

  const columns = getColumns(allDoctors, activeDoctors, basePath);

  const runSearch = async (filters: {
    date?: string;
    patientSearch?: string;
    primaryPhysician?: string;
    status?: Status;
  }) => {
    setIsSearching(true);
    const result = await listAppointments(filters);
    setAppointments(result);
    setIsSearching(false);
  };

  // TASK-068: `data` only ever seeded local state on mount — confirming,
  // cancelling or rescheduling a turno correctly calls router.refresh() (or
  // navigates back after a reschedule), which re-fetches this page's server
  // data and passes a new `data` array down, but this component never
  // noticed: useState(data) ignores prop changes on every render after the
  // first. Skips the very first run (that data is already what's on screen)
  // and re-applies whatever filters are currently set instead of blindly
  // overwriting them with the unfiltered `data` prop, so a refresh while a
  // search is active re-fetches that same filtered view instead of
  // discarding it.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    runSearch({
      date: date || undefined,
      patientSearch: patientSearch.trim() || undefined,
      primaryPhysician: doctor !== ALL ? doctor : undefined,
      status: status !== ALL ? (status as Status) : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    runSearch({
      date: date || undefined,
      patientSearch: patientSearch.trim() || undefined,
      primaryPhysician: doctor !== ALL ? doctor : undefined,
      status: status !== ALL ? (status as Status) : undefined,
    });
  };

  const handleClear = () => {
    setDate("");
    setPatientSearch("");
    setDoctor(ALL);
    setStatus(ALL);
    runSearch({});
  };

  return (
    <section className="w-full space-y-4">
      <form onSubmit={handleSearch} className="flex flex-col gap-2">
        <p>Filtrar turnos</p>
        <div className="flex flex-wrap items-end gap-2 md:flex-nowrap">
          <Input
            type="date"
            className="shad-input"
            aria-label="Fecha"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Input
            className="shad-input"
            placeholder="Paciente (nombre o DNI)"
            aria-label="Paciente"
            value={patientSearch}
            onChange={(event) => setPatientSearch(event.target.value)}
          />
          <Select value={doctor} onValueChange={setDoctor}>
            <SelectTrigger className="shad-select-trigger" aria-label="Doctor">
              <SelectValue placeholder="Doctor" />
            </SelectTrigger>
            <SelectContent className="shad-select-content">
              <SelectItem value={ALL}>Todos los doctores</SelectItem>
              {allDoctors.map((d) => (
                <SelectItem key={d.name} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="shad-select-trigger" aria-label="Estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="shad-select-content">
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {StatusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="shad-primary-btn"
              disabled={isSearching}
            >
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shad-gray-btn"
              onClick={handleClear}
              disabled={isSearching}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </form>

      <DataTable columns={columns} data={appointments} />
    </section>
  );
}
