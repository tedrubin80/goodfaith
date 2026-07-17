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
  release_type: ReleaseType;
  upc: string | null;
  release_date: string | null;
  tracks: Track[];
  track_count: number;
};

export type ReleaseType = "album" | "ep" | "single" | "compilation";

export const RELEASE_TYPES: { value: ReleaseType; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "ep", label: "EP" },
  { value: "album", label: "Album" },
  { value: "compilation", label: "Compilation" },
];

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
  payout_count: number;
  payout_batch_id: number | null;
  total_amount: string;
  currency: string;
  consolidation_error: string;
  created_at: string;
};

export type RoyaltyRunPayout = {
  id: number;
  run: number;
  track: number | null;
  isrc: string;
  track_title: string;
  participant_name: string;
  artist: number | null;
  role: string;
  role_display: string;
  share_percentage: string;
  track_gross: string;
  amount: string;
  unallocated_reason: string;
};

export type PayoutBatch = {
  id: number;
  label: number;
  run: number;
  run_name: string;
  name: string;
  status: "ready" | "partially_paid" | "paid" | "closed";
  total_amount: string;
  currency: string;
  payout_count: number;
  pending_count: number;
  paid_count: number;
  created_at: string;
};

export type Payout = {
  id: number;
  batch: number;
  artist: number | null;
  participant_name: string;
  amount: string;
  status: "pending" | "paid" | "cancelled";
  paid_at: string | null;
  payment_reference: string;
  created_at: string;
};

export type AuditEvent = {
  id: number;
  label: number;
  actor: number | null;
  actor_username: string | null;
  action: string;
  action_display: string;
  resource_type: string;
  resource_id: number;
  summary: string;
  metadata: Record<string, unknown>;
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

export type SplitRole =
  | "artist"
  | "producer"
  | "featured"
  | "writer"
  | "label"
  | "other";

export type SplitEntry = {
  id?: number;
  participant_name: string;
  artist: number | null;
  role: SplitRole;
  role_display?: string;
  percentage: string;
};

export type SplitSheet = {
  id: number;
  track: number;
  track_title: string;
  track_isrc: string | null;
  release_id: number;
  release_title: string;
  primary_artist_name: string;
  status: "draft" | "finalized";
  notes: string;
  entries: SplitEntry[];
  total_percentage: string;
  created_at: string;
  updated_at: string;
};

export type RoyaltyLineItem = {
  id: number;
  statement: number;
  track: number | null;
  sale_period: string | null;
  store: string;
  country: string;
  artist_name: string;
  track_title: string;
  isrc: string;
  upc: string;
  quantity: number;
  amount: string;
};

export const SPLIT_ROLES: { value: SplitRole; label: string }[] = [
  { value: "artist", label: "Artist" },
  { value: "producer", label: "Producer" },
  { value: "featured", label: "Featured Artist" },
  { value: "writer", label: "Writer" },
  { value: "label", label: "Label" },
  { value: "other", label: "Other" },
];
