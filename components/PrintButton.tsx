"use client";

import { Button } from "@/components/ui/button";

export const PrintButton = () => (
  <Button className="shad-primary-btn print:hidden" onClick={() => window.print()}>
    Imprimir / Descargar PDF
  </Button>
);
