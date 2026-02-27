import type { ReactNode } from "react";
import { COLORS } from "../constants/colors";

export function Panel({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
      {title && <h2 style={{ marginTop: 0 }}>{title}</h2>}
      {children}
    </div>
  );
}
