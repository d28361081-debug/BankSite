// Конфигурация подключения к предоставленной базе данных Supabase
const SUPABASE_URL = "https://aunfrnyhbfcxgdfhvcox.supabase.co";
const SUPABASE_KEY = "sb_publishable_8Xf1-4RnW0-f09idcW76vQ_JU5_Iqqe";

// Инициализация глобального клиента Supabase
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
