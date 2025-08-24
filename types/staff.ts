export type EmploymentType = 'FullTime' | 'PartTime' | 'PerDiem';

export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  employmentType: EmploymentType;
  primaryUnit: string;
  secondaryUnits: string[];
  fte: number;
  certifications: string[];
  seniority: number;
  unionGroup?: string;
}

export interface StaffAvailability {
  staffId: string;
  date: string;
  shift: 'D' | 'E' | 'N';
  requested: 'Off' | 'PreferOff' | 'PreferWork' | 'Committed';
  hardBlock: boolean;
  preferredUnit?: string;
}}