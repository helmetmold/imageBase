import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfeprdcotfmvpfkjdthc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZXByZGNvdGZtdnBma2pkdGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NzM5ODMsImV4cCI6MjA0NzI0OTk4M30.BH5shEVUATHZbep-cXYlHY8FtRt-VROlP6A1-BOi5es';
export const supabase = createClient(supabaseUrl, supabaseKey); 