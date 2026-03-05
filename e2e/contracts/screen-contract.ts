export type ScreenId =
  | "S01"
  | "S02"
  | "S03"
  | "S04"
  | "S05"
  | "S06"
  | "S07"
  | "S08"
  | "S09"
  | "S10"
  | "S11"
  | "S12"
  | "S13"
  | "S14"
  | "S15"
  | "S16"
  | "S17"
  | "S18"
  | "S19"
  | "S20"
  | "S21"
  | "S22"
  | "S23"
  | "S24"
  | "S25"
  | "S26"
  | "S27"
  | "S28";

export type ScreenActor = "public" | "therapist" | "patient" | "system";

export type ScreenTheme = "dark_core" | "dark_theater" | "light_onboard" | "light_patient";

export type ScreenSource = "stitch" | "derived";

export type CoverageLevel = "L1" | "L2" | "L3";

export type EvidenceRequirement =
  | "route-contract"
  | "flow-critical"
  | "trace"
  | "screenshot"
  | "visual-snapshot"
  | "api-auth"
  | "api-error"
  | "rls-check";

export interface ScreenContract {
  id: ScreenId;
  title: string;
  route: string;
  routePattern: string;
  aliases: string[];
  actor: ScreenActor;
  requiresAuth: boolean;
  theme: ScreenTheme;
  source: ScreenSource;
  coverageLevel: CoverageLevel;
  evidenceRequired: EvidenceRequirement[];
  testSpec: string;
  capture: {
    capturable: boolean;
    evidenceTarget: string;
  };
  sourceFile: string;
  derivesFrom?: ScreenId[];
}
