"use client";

import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Scale,
  FileCheck,
  Building2,
  BadgeCheck,
} from "lucide-react";

interface ComplianceBadgeProps {
  className?: string;
}

const certifications = [
  {
    icon: ShieldCheck,
    label: "USPAP",
    detail: "Uniform Standards of Professional Appraisal Practice",
    status: "compliant" as const,
  },
  {
    icon: Scale,
    label: "FIRREA",
    detail: "Financial Institutions Reform, Recovery, and Enforcement Act",
    status: "compliant" as const,
  },
  {
    icon: Building2,
    label: "FNMA",
    detail: "Fannie Mae Selling Guide Compliance",
    status: "compliant" as const,
  },
  {
    icon: FileCheck,
    label: "UAD",
    detail: "Uniform Appraisal Dataset Standards",
    status: "compliant" as const,
  },
];

export function ComplianceBadge({ className }: ComplianceBadgeProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-card p-5",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-primary" />
        <h4 className="font-mono text-xs font-medium tracking-wider text-foreground">
          REGULATORY COMPLIANCE
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {certifications.map((cert) => (
          <div
            key={cert.label}
            className="flex flex-col items-center gap-2 rounded-md border border-primary/10 bg-primary/5 px-3 py-3"
          >
            <cert.icon className="h-5 w-5 text-primary" />
            <span className="font-mono text-[10px] font-bold tracking-wider text-primary">
              {cert.label}
            </span>
            <span className="text-center font-mono text-[8px] leading-tight text-muted-foreground">
              {cert.detail}
            </span>
            <span className="rounded-sm bg-primary/10 px-2 py-0.5 font-mono text-[8px] font-semibold tracking-wider text-primary">
              COMPLIANT
            </span>
          </div>
        ))}
      </div>

      <p className="font-mono text-[9px] text-muted-foreground/60">
        TerraFusion AVM engine adheres to federal appraisal standards.
        Automated valuations are generated for informational purposes and
        should be reviewed by a licensed appraiser before use in lending
        decisions.
      </p>
    </div>
  );
}
