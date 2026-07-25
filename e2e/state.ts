import fs from "fs";
import path from "path";

// Small JSON-file-backed state shared across spec files that must run in a
// fixed order (00-setup -> 01-auth -> 02-flujo -> 03-security). Playwright
// workers=1 + sequential file order (numeric prefixes) guarantees writers
// run before readers. Kept out of git via .gitignore (e2e/.state/).
const STATE_DIR = path.join(__dirname, ".state");
const STATE_FILE = path.join(STATE_DIR, "state.json");

export interface QaState {
  doctor?: {
    id: string;
    name: string;
    email: string;
    password: string;
  };
  patient?: {
    userId: string;
    patientId?: string;
    name: string;
    email: string;
    phone: string;
  };
  appointment?: {
    appointmentId: string;
    scheduleIso: string;
    dayOfMonth: string;
    timeLabel: string;
  };
  identificationFileId?: string;
}

export function readState(): QaState {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

export function writeState(patch: Partial<QaState>): QaState {
  const current = readState();
  const next = { ...current, ...patch };
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2));
  return next;
}
