import "server-only";

import { createStorageService } from "@/lib/services/storage";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const storageService = createStorageService(getSupabaseServiceRoleClient());
