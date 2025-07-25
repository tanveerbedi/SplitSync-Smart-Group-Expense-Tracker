import type { SVGProps } from "react";

export function SplitSyncLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 4V2" />
      <path d="M12 22v-2" />
      <path d="M12 16a2 2 0 0 0-2 2" />
      <path d="M12 8a2 2 0 0 0 2-2" />
      <path d="M20 10V6" />
      <path d="M4 10V6" />
      <path d="m15 11-4 4" />
      <path d="M9 11h.01" />
      <path d="M15 17h.01" />
    </svg>
  );
}
