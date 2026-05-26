export async function runDatabaseSetup(
  supabaseUrl: string,
  serviceKey: string,
  logs: string[]
): Promise<{ success: boolean; results: Record<string, string> }> {
  const results: Record<string, string> = {};

  const runSQL = async (sql: string, label: string): Promise<boolean> => {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });
      if (!res.ok) {
        // Try alternative RPC name
        const res2 = await fetch(`${supabaseUrl}/rest/v1/rpc/run_sql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": serviceKey,
            "Authorization": `Bearer ${serviceKey}`
          },
          body: JSON.stringify({ query: sql })
        });
        if (!res2.ok) {
          const bodyErr = await res2.text().catch(() => "");
          logs.push(`⚠️ ${label}: RPC run_sql failed (status ${res2.status}). Response: ${bodyErr}`);
          results[label] = `Failed: RPC not available. Status: ${res2.status}`;
          return false;
        }
      }
      logs.push(`✅ ${label}: Success`);
      results[label] = "Success";
      return true;
    } catch (e: any) {
      logs.push(`❌ ${label}: ${e.message}`);
      results[label] = `Error: ${e.message}`;
      return false;
    }
  };

  logs.push("🚀 Starting database schema self-healing setup...");

  // BLOCK 1: CREATE ALL TABLES (IF NOT EXISTS)
  const sql_1_1 = `
    CREATE TABLE IF NOT EXISTS public.users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      "fullName" TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'recruiter',
      title TEXT DEFAULT 'Staff Officer',
      phone TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const sql_1_2 = `
    CREATE TABLE IF NOT EXISTS public.jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      institution TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      requirements JSONB DEFAULT '[]'::jsonb,
      type TEXT DEFAULT 'Full-time',
      is_active BOOLEAN DEFAULT TRUE,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );
  `;

  const sql_1_3 = `
    CREATE TABLE IF NOT EXISTS public.applicants (
      id TEXT PRIMARY KEY,
      applicant_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      job_id TEXT,
      job_title TEXT,
      resume_file_name TEXT,
      resume_text TEXT,
      status TEXT DEFAULT 'New',
      age INTEGER,
      civil_status TEXT DEFAULT 'Single',
      address TEXT,
      education_level TEXT DEFAULT 'College Graduate',
      course_graduated TEXT DEFAULT NULL,
      screening_answers JSONB DEFAULT '[]'::jsonb,
      endorsed_to TEXT,
      hr_incharge TEXT,
      remarks TEXT,
      ai_summary JSONB DEFAULT '{}'::jsonb,
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const sql_1_4 = `
    CREATE TABLE IF NOT EXISTS public.screening_questions (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('select', 'boolean', 'text')),
      options JSONB DEFAULT '[]'::jsonb,
      required BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0
    );
  `;

  const sql_1_5 = `
    CREATE TABLE IF NOT EXISTS public.homepage_settings (
      id BIGINT PRIMARY KEY DEFAULT 1,
      badge_text TEXT DEFAULT 'Empowering Countrysides via Intelligent Recruitment',
      title TEXT DEFAULT 'Build Your Career, Transform Filipino Lives',
      description TEXT,
      emergency_contacts JSONB DEFAULT '[]'::jsonb,
      branches_count TEXT DEFAULT '200+',
      years_of_service TEXT DEFAULT '35+',
      filipinos_empowered TEXT DEFAULT '5M+',
      hero_image_url TEXT DEFAULT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const sql_1_6 = `
    CREATE TABLE IF NOT EXISTS public.about_settings (
      id BIGINT PRIMARY KEY DEFAULT 1,
      mission_text TEXT,
      vision_text TEXT,
      contact_address TEXT DEFAULT '20 M. L. Quezon St., City of San Pablo, Laguna',
      contact_phone TEXT DEFAULT '+63 (2) 584-3333 extension line 403',
      contact_email TEXT DEFAULT 'mri_recruitment@cardmri.com',
      moral_compass_values JSONB DEFAULT '[]'::jsonb,
      legacy_timeline JSONB DEFAULT '[]'::jsonb,
      institution_branches JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const sql_1_7 = `
    CREATE TABLE IF NOT EXISTS public.system_logs (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      operation TEXT NOT NULL,
      details TEXT,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const sql_1_8 = `
    CREATE TABLE IF NOT EXISTS public.system_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_by TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await runSQL(sql_1_1, "SQL 1.1 users table");
  await runSQL(sql_1_2, "SQL 1.2 jobs table");
  await runSQL(sql_1_3, "SQL 1.3 applicants table");
  await runSQL(sql_1_4, "SQL 1.4 screening_questions table");
  await runSQL(sql_1_5, "SQL 1.5 homepage_settings table");
  await runSQL(sql_1_6, "SQL 1.6 about_settings table");
  await runSQL(sql_1_7, "SQL 1.7 system_logs table");
  await runSQL(sql_1_8, "SQL 1.8 system_settings table");

  // BLOCK 2: ADD MISSING COLUMNS (ALTER TABLE)
  await runSQL("ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS course_graduated TEXT DEFAULT NULL;", "SQL 2.1 ADD course_graduated");
  await runSQL("ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();", "SQL 2.2 ADD applicants.created_at");
  await runSQL("ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW();", "SQL 2.3 ADD applicants.applied_at");
  await runSQL("ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS branches_count TEXT DEFAULT '200+';", "SQL 2.4 ADD branches_count");
  await runSQL("ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS years_of_service TEXT DEFAULT '35+';", "SQL 2.5 ADD years_of_service");
  await runSQL("ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS filipinos_empowered TEXT DEFAULT '5M+';", "SQL 2.6 ADD filipinos_empowered");
  await runSQL("ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT NULL;", "SQL 2.7 ADD hero_image_url");
  await runSQL("ALTER TABLE public.about_settings ADD COLUMN IF NOT EXISTS moral_compass_values JSONB DEFAULT '[]'::jsonb;", "SQL 2.8 ADD moral_compass_values");
  await runSQL("ALTER TABLE public.about_settings ADD COLUMN IF NOT EXISTS legacy_timeline JSONB DEFAULT '[]'::jsonb;", "SQL 2.9 ADD legacy_timeline");
  await runSQL("ALTER TABLE public.about_settings ADD COLUMN IF NOT EXISTS institution_branches JSONB DEFAULT '[]'::jsonb;", "SQL 2.10 ADD institution_branches");
  await runSQL("ALTER TABLE public.screening_questions ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;", "SQL 2.11 ADD sort_order");
  await runSQL("ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;", "SQL 2.12 ADD jobs.updated_at");

  // BLOCK 3: ENABLE RLS ON ALL TABLES
  await runSQL("ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;", "SQL 3.1 users RLS");
  await runSQL("ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;", "SQL 3.2 jobs RLS");
  await runSQL("ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;", "SQL 3.3 applicants RLS");
  await runSQL("ALTER TABLE public.screening_questions ENABLE ROW LEVEL SECURITY;", "SQL 3.4 screening questions RLS");
  await runSQL("ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;", "SQL 3.5 homepage_settings RLS");
  await runSQL("ALTER TABLE public.about_settings ENABLE ROW LEVEL SECURITY;", "SQL 3.6 about_settings RLS");
  await runSQL("ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;", "SQL 3.7 system_logs RLS");
  await runSQL("ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;", "SQL 3.8 system_settings RLS");

  // BLOCK 4: CREATE RLS POLICIES (DROP FIRST)
  // Users Policy
  await runSQL(`
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.users;
      DROP POLICY IF EXISTS "anon_read" ON public.users;
      DROP POLICY IF EXISTS "anon_manage" ON public.users;
    END $$;
  `, "SQL 4.1.Drop Users Policies");
  await runSQL(`
    CREATE POLICY "cardmri_users_policy" ON public.users 
      FOR ALL TO anon USING (true) WITH CHECK (true);
  `, "SQL 4.1.Create Users Policy");

  // Jobs Policy
  await runSQL(`
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.jobs;
      DROP POLICY IF EXISTS "anon_read_jobs" ON public.jobs;
      DROP POLICY IF EXISTS "anon_manage_jobs" ON public.jobs;
    END $$;
  `, "SQL 4.2.Drop Jobs Policies");
  await runSQL(`
    CREATE POLICY "cardmri_jobs_policy" ON public.jobs 
      FOR ALL TO anon USING (true) WITH CHECK (true);
  `, "SQL 4.2.Create Jobs Policy");

  // Applicants Policy
  await runSQL(`
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.applicants;
      DROP POLICY IF EXISTS "anon_read_applicants" ON public.applicants;
      DROP POLICY IF EXISTS "anon_insert_applicants" ON public.applicants;
      DROP POLICY IF EXISTS "anon_update_applicants" ON public.applicants;
      DROP POLICY IF EXISTS "anon_delete_applicants" ON public.applicants;
      DROP POLICY IF EXISTS "Public Submissions Policy" ON public.applicants;
      DROP POLICY IF EXISTS "Anon Read Applicants" ON public.applicants;
      DROP POLICY IF EXISTS "Anon Update Applicants" ON public.applicants;
      DROP POLICY IF EXISTS "Anon Delete Applicants" ON public.applicants;
    END $$;
  `, "SQL 4.3.Drop Applicants Policies");
  await runSQL("CREATE POLICY \"cardmri_applicants_select\" ON public.applicants FOR SELECT TO anon USING (true);", "SQL 4.3.Select Applicants Policy");
  await runSQL("CREATE POLICY \"cardmri_applicants_insert\" ON public.applicants FOR INSERT TO anon WITH CHECK (true);", "SQL 4.3.Insert Applicants Policy");
  await runSQL("CREATE POLICY \"cardmri_applicants_update\" ON public.applicants FOR UPDATE TO anon USING (true) WITH CHECK (true);", "SQL 4.3.Update Applicants Policy");
  await runSQL("CREATE POLICY \"cardmri_applicants_delete\" ON public.applicants FOR DELETE TO anon USING (true);", "SQL 4.3.Delete Applicants Policy");

  // Screening Questions Policy
  await runSQL(`
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.screening_questions;
      DROP POLICY IF EXISTS "anon_all_screening" ON public.screening_questions;
    END $$;
  `, "SQL 4.4.Drop Screening Policies");
  await runSQL(`
    CREATE POLICY "cardmri_screening_policy" ON public.screening_questions 
      FOR ALL TO anon USING (true) WITH CHECK (true);
  `, "SQL 4.4.Create Screening Policy");

  // Homepage Settings Policy
  await runSQL(`
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.homepage_settings;
      DROP POLICY IF EXISTS "anon_all_homepage" ON public.homepage_settings;
    END $$;
  `, "SQL 4.5.Drop Homepage Policies");
  await runSQL(`
    CREATE POLICY "cardmri_homepage_policy" ON public.homepage_settings 
      FOR ALL TO anon USING (true) WITH CHECK (true);
  `, "SQL 4.5.Create Homepage Policy");

  // About Settings Policy
  await runSQL(`
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.about_settings;
      DROP POLICY IF EXISTS "anon_all_about" ON public.about_settings;
    END $$;
  `, "SQL 4.6.Drop About Policies");
  await runSQL(`
    CREATE POLICY "cardmri_about_policy" ON public.about_settings 
      FOR ALL TO anon USING (true) WITH CHECK (true);
  `, "SQL 4.6.Create About Policy");

  // System Logs Policy
  await runSQL(`
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.system_logs;
      DROP POLICY IF EXISTS "anon_all_logs" ON public.system_logs;
    END $$;
  `, "SQL 4.7.Drop Logs Policies");
  await runSQL(`
    CREATE POLICY "cardmri_logs_policy" ON public.system_logs 
      FOR ALL TO anon USING (true) WITH CHECK (true);
  `, "SQL 4.7.Create Logs Policy");

  // System Settings Policy
  await runSQL(`
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "anon_all_system_settings" ON public.system_settings;
    END $$;
  `, "SQL 4.8.Drop System Settings Policies");
  await runSQL(`
    CREATE POLICY "cardmri_system_settings_policy" ON public.system_settings 
      FOR ALL TO anon USING (true) WITH CHECK (true);
  `, "SQL 4.8.Create System Settings Policy");

  // BLOCK 5: SEED INITIAL DATA (UPSERT — SAFE)
  const sql_5_1 = `
    INSERT INTO public.users 
      (id, email, "fullName", password, role, title, phone, "createdAt")
    VALUES (
      'user-michael-admin-001',
      'michealangelo.canlas@cardmri.com',
      'Michael Angelo Canlas',
      '$2a$12$K1R2TfWlQ2E.8P3u1hSDeOmI6qR9Xm5tU0k9eT3tY2e5e1mSu3G4q',
      'it_admin',
      'IT Administrator',
      '+63 918 100 2000',
      NOW()
    ) ON CONFLICT (email) DO NOTHING;
  `;

  const sql_5_2 = `
    INSERT INTO public.users 
      (id, email, "fullName", password, role, title, phone, "createdAt")
    VALUES (
      'user-ailen-recruiter-001',
      'ailen.entero@cardmri.com',
      'Ailen Entero',
      '$2a$12$RkP2r3TeUqYpW1h8gP2vXOm7eT6aW4eLpS8yE3vS2r5e4mTeO3k2q',
      'recruiter',
      'Recruitment Officer',
      '+63 917 123 4567',
      NOW()
    ) ON CONFLICT (email) DO NOTHING;
  `;

  const sql_5_3 = `
    INSERT INTO public.homepage_settings 
      (id, badge_text, title, description, 
       emergency_contacts, branches_count, 
       years_of_service, filipinos_empowered)
    VALUES (
      1,
      'Empowering Countrysides via Intelligent Recruitment',
      'Build Your Career, Transform Filipino Lives',
      'Become part of the CARD Mutually Reinforcing Institutions legacy.',
      '[{"id":"1","label":"CARD MRI Central Office","value":"20 M. L. Quezon St., City of San Pablo, Laguna"},{"id":"2","label":"HRD Hotlines","value":"+63 (2) 584-3333 ext 403"},{"id":"3","label":"Email","value":"mri_recruitment@cardmri.com"}]'::jsonb,
      '200+', '35+', '5M+'
    ) ON CONFLICT (id) DO NOTHING;
  `;

  const sql_5_4 = `
    INSERT INTO public.about_settings (id, mission_text, vision_text)
    VALUES (
      1,
      'To provide responsive banking and financial services to the marginalized sectors of society.',
      'A nation where rural families are empowered through accessible financial services.'
    ) ON CONFLICT (id) DO NOTHING;
  `;

  const sql_5_5 = `
    INSERT INTO public.screening_questions 
      (id, text, type, options, required, is_active, sort_order)
    VALUES
      ('q-1', 'Where did you hear about this career opportunity?', 
       'select', 
       '["Social Media","School Job Fair","Employee Referral","Newspaper/Flyer","Walk-in"]'::jsonb, 
       true, true, 1),
      ('q-2', 'Are you willing to be assigned to any branch or field office matching CARD MRI priorities?', 
       'boolean', '[]'::jsonb, true, true, 2),
      ('q-3', 'Are you related to any active employee of CARD MRI entities up to the third degree of consanguinity or affinity?', 
       'boolean', '[]'::jsonb, true, true, 3),
      ('q-4', 'Do you have experience in field-based operations, collection, or community service work?', 
       'boolean', '[]'::jsonb, true, true, 4)
    ON CONFLICT (id) DO NOTHING;
  `;

  const sql_5_6 = `
    INSERT INTO public.jobs 
      (id, title, department, institution, location, 
       description, requirements, type, is_active)
    VALUES
      ('job-bmf-001', 'Branch Microfinance Officer', 'Branch Operations',
       'CARD Bank, Inc.', 'San Pablo City, Laguna',
       'Responsible for loan evaluations, conducting interviews, client orientations, and facilitating field disbursements.',
       '["Graduate of any 4-year Bachelor''s Degree","Willing to travel and do field work","Strong communication skills","Values integrity and has a heart for poverty eradication"]'::jsonb,
       'Full-time', true),
      ('job-fin-001', 'Accountant / Finance Specialist', 'Finance Center',
       'CARD SME Bank, Inc.', 'Lucena City, Quezon',
       'Handles bank reconciliation, monitors cash flow, ensures local tax compliance.',
       '["BS Accountancy Graduate","At least 1-2 years experience in finance","Highly meticulous and accurate","Proficient in accounting software"]'::jsonb,
       'Full-time', true),
      ('job-it-001', 'IT Support & System Specialist', 'Information Technology Unit',
       'CARD MRI IT Mutual Benefit Association', 'Bay, Laguna',
       'Maintains network firewalls, handles hardware setups, supports digital apps.',
       '["BS Information Technology or Computer Science","Knowledge in Linux or network subnetting","Willing to offer tech support on field","Good communication and problem-solving skills"]'::jsonb,
       'Full-time', true),
      ('job-hr-001', 'Recruitment Coordinator & HR Generalist', 'Human Resource Development',
       'CARD Mutually Reinforcing Institutions', 'San Pablo City, Laguna',
       'Aids in resume sorting, manages applicant files, coordinates evaluations.',
       '["BS Psychology or Human Resource","Excellent organization abilities","Interest in digitized workflows","Outstanding communication skills"]'::jsonb,
       'Full-time', true)
    ON CONFLICT (id) DO NOTHING;
  `;

  const sql_5_7 = `
    INSERT INTO public.system_settings (key, value, updated_at)
    VALUES 
      ('statuses_list', 
       '["New","Acknowledge","Passed Screening","Already Endorsed","Hired","Rejected","Rejected (With Relatives)"]'::jsonb,
       NOW()),
      ('institutions_list',
       '["CARD Bank","CARD SME Bank","CARD MBA","CARD MRI IT","CARD NGO","CARD Pioneer","CARD Leasing","CARD Livelihood","HR Department","Finance Center","IT Admin Unit","Branch Operations"]'::jsonb,
       NOW()),
      ('hr_incharges_list',
       '["Ms. Ailen Entero","Ms. Mary Jane Romero","Mr. Edmon Bazar","Ms. Sarah Balazo","Ms. Christine Ramos","Mr. Juan Dela Cruz","Ms. Maria Santos","Mr. Robert Lim"]'::jsonb,
       NOW())
    ON CONFLICT (key) DO NOTHING;
  `;

  await runSQL(sql_5_1, "SQL 5.1 Seed Admin Michael User");
  await runSQL(sql_5_2, "SQL 5.2 Seed Recruiter Ailen User");
  await runSQL(sql_5_3, "SQL 5.3 Seed Homepage settings row");
  await runSQL(sql_5_4, "SQL 5.4 Seed About settings row");
  await runSQL(sql_5_5, "SQL 5.5 Seed default screening questions");
  await runSQL(sql_5_6, "SQL 5.6 Seed default job postings");
  await runSQL(sql_5_7, "SQL 5.7 Seed default dropdown system settings");

  const overallSuccess = !logs.some(l => l.startsWith("❌"));
  return { success: overallSuccess, results };
}
