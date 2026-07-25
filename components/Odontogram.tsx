"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { saveOdontogram } from "@/lib/actions/odontogram.actions";
import type { Tooth, ToothCondition, ToothFace } from "@/lib/odontogram/createEmptyOdontogram";

const CONDITION_CYCLE: (ToothCondition | undefined)[] = [
  undefined,
  "Caries",
  "Obturado",
  "Ausente",
  "Endodoncia",
  "Corona",
];

const CONDITION_COLOR: Record<ToothCondition, string> = {
  Caries: "bg-red-500",
  Obturado: "bg-blue-500",
  Ausente: "bg-slate-700",
  Endodoncia: "bg-purple-500",
  Corona: "bg-yellow-500",
};

const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// 3x3 grid layout per tooth, positions match the classic dental-chart
// "plus sign" arrangement (vestibular/palatal top-bottom, mesial/distal
// left-right, oclusal center). Plain CSS grid + colored cells, not SVG
// tooth art — "graphical" in the sense of visual/clickable, not anatomical.
const FACE_GRID_POSITION: Record<ToothFace, string> = {
  vestibular: "col-start-2 row-start-1",
  mesial: "col-start-1 row-start-2",
  oclusal: "col-start-2 row-start-2",
  distal: "col-start-3 row-start-2",
  palatal: "col-start-2 row-start-3",
};

interface OdontogramProps {
  patientId: string;
  initialTeeth: Tooth[];
}

function nextCondition(current: ToothCondition | undefined): ToothCondition | undefined {
  const index = CONDITION_CYCLE.indexOf(current);
  return CONDITION_CYCLE[(index + 1) % CONDITION_CYCLE.length];
}

const ToothGrid = ({
  tooth,
  onFaceClick,
}: {
  tooth: Tooth;
  onFaceClick: (toothNumber: number, face: ToothFace) => void;
}) => (
  <div className="flex flex-col items-center gap-1">
    <div className="grid grid-cols-3 grid-rows-3 gap-[2px] border border-dark-500 p-[2px]">
      {(Object.keys(FACE_GRID_POSITION) as ToothFace[]).map((face) => {
        const condition = tooth.faces[face];
        return (
          <button
            key={face}
            type="button"
            title={`${tooth.toothNumber} · ${face}${condition ? ` · ${condition}` : ""}`}
            onClick={() => onFaceClick(tooth.toothNumber, face)}
            className={`size-4 ${FACE_GRID_POSITION[face]} ${
              condition ? CONDITION_COLOR[condition] : "bg-white"
            }`}
          />
        );
      })}
    </div>
    <span className="text-12-regular text-dark-700">{tooth.toothNumber}</span>
  </div>
);

export const Odontogram = ({ patientId, initialTeeth }: OdontogramProps) => {
  const router = useRouter();
  const [teeth, setTeeth] = useState<Tooth[]>(initialTeeth);
  const [isSaving, setIsSaving] = useState(false);

  const byNumber = (toothNumber: number) => teeth.find((t) => t.toothNumber === toothNumber)!;

  const handleFaceClick = (toothNumber: number, face: ToothFace) => {
    setTeeth((current) =>
      current.map((tooth) =>
        tooth.toothNumber === toothNumber
          ? { ...tooth, faces: { ...tooth.faces, [face]: nextCondition(tooth.faces[face]) } }
          : tooth,
      ),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveOdontogram(patientId, teeth);
    setIsSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-2">
        {UPPER_ARCH.map((toothNumber) => (
          <ToothGrid key={toothNumber} tooth={byNumber(toothNumber)} onFaceClick={handleFaceClick} />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {LOWER_ARCH.map((toothNumber) => (
          <ToothGrid key={toothNumber} tooth={byNumber(toothNumber)} onFaceClick={handleFaceClick} />
        ))}
      </div>

      <div className="text-12-regular flex flex-wrap gap-4">
        {(Object.keys(CONDITION_COLOR) as ToothCondition[]).map((condition) => (
          <div key={condition} className="flex items-center gap-1">
            <span className={`inline-block size-3 ${CONDITION_COLOR[condition]}`} />
            {condition}
          </div>
        ))}
      </div>

      <Button
        type="button"
        className="shad-primary-btn"
        disabled={isSaving}
        onClick={handleSave}
      >
        {isSaving ? "Guardando..." : "Guardar odontograma"}
      </Button>
    </div>
  );
};
