import { createClient } from "@supabase/supabase-js";

// Check for custom Vite environment variables, falling back to CARD MRI default instance
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

const supabaseUrl = envUrl.trim() || "https://nhspkwtjuybtwwdweqfy.supabase.co";
const supabaseAnonKey = envAnonKey.trim() || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3Brd3RqdXlidHd3ZHdlcWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjEyNzAsImV4cCI6MjA5NDg5NzI3MH0.lkIL23WuMF-DC9LDRZeNlP_25ZDbCF95xoU3UZgoMzw";

export const isSupabaseConfigured = true;

const client = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseClient = () => {
  return client;
};
