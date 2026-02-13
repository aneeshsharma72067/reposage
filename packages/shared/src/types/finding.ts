import { Severity } from '../enums/severity';

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
}
