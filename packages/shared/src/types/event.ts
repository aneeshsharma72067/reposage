export interface Event {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}
