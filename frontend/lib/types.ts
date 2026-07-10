export type UserRole = "artist" | "manager" | "finance" | "ar" | "admin";

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
};

export type Label = {
  id: number;
  name: string;
  slug: string;
};

export type Artist = {
  id: number;
  label: number;
  name: string;
  slug: string;
  user: number | null;
};

export type Track = {
  id: number;
  release: number;
  title: string;
  isrc: string | null;
  track_number: number;
  duration_seconds: number | null;
};

export type Release = {
  id: number;
  label: number;
  primary_artist: number;
  primary_artist_name: string;
  title: string;
  release_type: "album" | "ep" | "single" | "compilation";
  upc: string | null;
  release_date: string | null;
  tracks: Track[];
  track_count: number;
};

export type StatementStatus = "pending" | "processing" | "processed" | "failed";

export type RoyaltyStatement = {
  id: number;
  label: number;
  distributor: string;
  distributor_display: string;
  filename: string;
  period_start: string | null;
  period_end: string | null;
  status: StatementStatus;
  status_display: string;
  row_count: number | null;
  total_amount: string | null;
  currency: string;
  uploaded_by_username: string;
  error_message: string;
  created_at: string;
};

export type RoyaltyRun = {
  id: number;
  label: number;
  name: string;
  status: "draft" | "ready" | "closed";
  statement_count: number;
  total_amount: string;
  currency: string;
  created_at: string;
};

export const DISTRIBUTORS = [
  { value: "distrokid", label: "DistroKid" },
  { value: "tunecore", label: "TuneCore" },
  { value: "cd_baby", label: "CD Baby" },
  { value: "symphonic", label: "Symphonic" },
  { value: "onerpm", label: "ONErpm" },
  { value: "routenote", label: "RouteNote" },
  { value: "toolost", label: "TooLost" },
  { value: "fuga", label: "FUGA" },
  { value: "vydia", label: "Vydia" },
  { value: "the_orchard", label: "The Orchard" },
  { value: "other", label: "Other" },
] as const;
