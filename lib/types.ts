export type ObservationStatus = "Draft" | "Active" | "Archived";
export type Confidence = "Low" | "Medium" | "High";

export type ContextItem = {
  key: string;
  value: string;
};

export type AttachmentKind = "image" | "pdf" | "csv";

export type Attachment = {
  id: string;
  observationId: string;
  userId: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  storagePath: string;
  createdAt: string;
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ObservationInput = {
  title?: string;
  observation?: string;
  context?: ContextItem[];
  interpretation?: string;
  nextAction?: string;
  status?: ObservationStatus;
  confidence?: Confidence;
  projectId?: string | null;
  tags?: string[];
  links?: { url: string; title?: string }[];
  attachments?: Attachment[];
};

export type Observation = {
  id: string;
  userId: string;
  title: string;
  observation: string;
  context: ContextItem[];
  interpretation: string;
  nextAction: string;
  status: ObservationStatus;
  confidence: Confidence;
  projectId: string | null;
  tags: string[];
  links: { url: string; title?: string }[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
};

export type ObservationFilters = {
  q?: string;
  status?: ObservationStatus;
  confidence?: Confidence;
  projectId?: string;
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export type ApiError = {
  code: string;
  message: string;
  fields?: string[];
};
