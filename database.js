/**
 * ZHOTOMER RP // DATABASE SYSTEM - CORE SUPABASE CONNECTION
 * Подключение твоей базы данных напрямую через асинхронные веб-запросы.
 */

const SUPABASE_URL = 'https://aunfrnyhbfcxgdfhvcox.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_8Xf1-4RnW0-f09idcW76vQ_JU5_Iqqe';

// Инициализируем клиент базы данных Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Database = {
    // Скачать список всех зарегистрированных игроков
    async getUsers() {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) return [];
        return data || [];
    },

    // Получить одного игрока по его ID
    async getUserById(userId) {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        if (error) return null;
        return data;
    },

    // Скачать всю историю переводов
    async getTransactions() {
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .order('timestamp', { ascending: false });
        if (error) return [];
        return data || [];
    },

    // Генерация случайного 8-значного Bank ID
    async generateUniqueBankId() {
        let uniqueId = '';
        let isUnique = false;
        while (!isUnique) {
            uniqueId = Math.floor(10000000 + Math.random() * 90000000).toString();
            const { data } = await supabaseClient.from('users').select('id').eq('id', uniqueId);
            if (!data || data.length === 0) isUnique = true;
        }
        return uniqueId;
    },

    // Регистрация аккаунта
    async registerUser(username, password) {
        const { data: check } = await supabaseClient.from('users').select('username').ilike('username', username);
        if (check && check.length > 0) {
            return { success: false, message: 'Этот никнейм уже занят в базе данных!' };
        }

        const newId = await this.generateUniqueBankId();
        const { data, error } = await supabaseClient
            .from('users')
            .insert([{ id: newId, username: username, password: password, balance: 5000 }])
            .select().single();

        if (error) return { success: false, message: 'Ошибка записи в облачную базу.' };
        return { success: true, user: data };
    },

    // Авторизация
    async loginUser(username, password) {
        const { data: user, error } = await supabaseClient
            .from('users').select('*').eq('username', username).eq('password', password).maybeSingle();

        if (error || !user) return { success: false, message: 'Ошибка авторизации. Неверные данные.' };
        if (user.isBanned) return { success: false, isBanned: true, message: 'Ваш узел заблокирован.' };

        return { success: true, user: user };
    },

    // Выполнение денежной транзакции
    async executeTransaction(senderId, receiverId, amount) {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) return { success: false, message: 'Сумма указана некорректно.' };
        if (senderId === receiverId) return { success: false, message: 'Нельзя переводить самому себе.' };

        const sender = await this.getUserById(senderId);
        const receiver = await this.getUserById(receiverId);

        if (!sender) return { success: false, message: 'Отправитель не найден.' };
        if (!receiver) return { success: false, message: 'Получатель не найден в базе данных.' };
        if (receiver.isBanned) return { success: false, message: 'Счет получателя заморожен.' };

        if (!sender.isAdmin && parseFloat(sender.balance) < amount) {
            return { success: false, message: 'Недостаточно средств.' };
        }

        if (!sender.isAdmin) {
            await supabaseClient.from('users').update({ balance: parseFloat(sender.balance) - amount }).eq('id', senderId);
        }
        await supabaseClient.from('users').update({ balance: parseFloat(receiver.balance) + amount }).eq('id', receiverId);

        // Пишем лог
        await supabaseClient.from('transactions').insert([
            { senderId: senderId, senderName: sender.username, receiverId: receiverId, receiverName: receiver.username, amount: amount }
        ]);

        return { success: true };
    },

    // Админ-изменение статуса
    async adminUpdateUser(targetId, fields) {
        const { error } = await supabaseClient.from('users').update(fields).eq('id', targetId);
        return !error;
    }
};
