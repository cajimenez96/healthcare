export type ToothCondition =
  | "Caries"
  | "Obturado"
  | "Ausente"
  | "Endodoncia"
  | "Corona";

export type ToothFace = "mesial" | "distal" | "vestibular" | "palatal" | "oclusal";

export const TOOTH_FACES: ToothFace[] = [
  "mesial",
  "distal",
  "vestibular",
  "palatal",
  "oclusal",
];

export interface Tooth {
  toothNumber: number;
  faces: Partial<Record<ToothFace, ToothCondition>>;
}

const QUADRANTS = [1, 2, 3, 4];
const POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export const FDI_PERMANENT_TOOTH_NUMBERS: number[] = QUADRANTS.flatMap((quadrant) =>
  POSITIONS.map((position) => quadrant * 10 + position),
);

export function createEmptyOdontogram(): Tooth[] {
  return FDI_PERMANENT_TOOTH_NUMBERS.map((toothNumber) => ({
    toothNumber,
    faces: {
      mesial: undefined,
      distal: undefined,
      vestibular: undefined,
      palatal: undefined,
      oclusal: undefined,
    },
  }));
}
