export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  display_name: string;
  color: string;
  role: "parent" | "guardian" | "other";
  created_at: string;
};

export type Child = {
  id: string;
  household_id: string;
  full_name: string;
  date_of_birth: string | null;
  notes: string | null;
};

export type EventCategory = "custody" | "school" | "medical" | "activity" | "general";

export type CalendarEvent = {
  id: string;
  household_id: string;
  created_by: string;
  title: string;
  description: string | null;
  category: EventCategory;
  start_at: string;
  end_at: string;
  all_day: boolean;
  responsible_member_id: string | null;
};

export type Message = {
  id: string;
  household_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
};

export type ExpenseCategory = "medical" | "school" | "activity" | "clothing" | "childcare" | "other";

export type Expense = {
  id: string;
  household_id: string;
  created_by: string;
  description: string;
  category: ExpenseCategory;
  amount_cents: number;
  paid_by_member_id: string;
  incurred_on: string;
  receipt_url: string | null;
  created_at: string;
};

export type ExpenseShare = {
  id: string;
  expense_id: string;
  member_id: string;
  share_cents: number;
  status: "owed" | "paid";
  paid_at: string | null;
};

export type Contact = {
  id: string;
  household_id: string;
  name: string;
  role: "doctor" | "school" | "emergency" | "caregiver" | "other";
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type Document = {
  id: string;
  household_id: string;
  uploaded_by: string;
  title: string;
  storage_path: string;
  category: "legal" | "medical" | "school" | "other";
  created_at: string;
};

export type PlanNote = {
  id: string;
  household_id: string;
  created_by: string;
  title: string;
  body: string;
  status: "open" | "in_progress" | "resolved";
  target_date: string | null;
  created_at: string;
  updated_at: string;
};
