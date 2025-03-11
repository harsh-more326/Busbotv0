import { createClient } from "@supabase/supabase-js"

const supabaseUrl = 'https://bukreajcgmujspiuintq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1a3JlYWpjZ211anNwaXVpbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjYzNzMsImV4cCI6MjA1NjQ0MjM3M30.33_osf3Q4SPIm2om1pRrZNIHor1_DlpWrW3-rkAopr8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

