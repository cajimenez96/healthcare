import clsx from "clsx";
import Image from "next/image";

type StatCardProps = {
  type: "appointments" | "pending" | "cancelled" | "completed";
  count: number;
  label: string;
  icon: string;
};

export const StatCard = ({ count = 0, label, icon, type }: StatCardProps) => {
  return (
    <div
      className={clsx("stat-card", {
        // "completed" reuses the "appointments" background image — there's
        // no dedicated asset for it, and both represent a positive outcome
        // (same green treatment StatusBadge already gives both statuses).
        "bg-appointments": type === "appointments" || type === "completed",
        "bg-pending": type === "pending",
        "bg-cancelled": type === "cancelled",
      })}
    >
      <div className="flex items-center gap-4">
        <Image
          src={icon}
          height={32}
          width={32}
          alt="appointments"
          className="size-8 w-fit"
        />
        <h2 className="text-32-bold text-white">{count}</h2>
      </div>

      <p className="text-14-regular">{label}</p>
    </div>
  );
};
