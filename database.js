(function () {
    // ВШИТЫЕ КЛЮЧИ ДОСТУПА К SUPABASE CLOUD (ОБЛАКО ДЛЯ СЕТЕВОЙ РАБОТЫ)
    const SUPABASE_URL = "https://wunclvpywstisbfeclwz.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bmNsdnB5d3N0aXNiZmVjbHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0OTY4MTIsImV4cCI6MjAzMTA3MjgxMn0.0fTmsVpY8GZlyS1fF_i86bUaA28L9PzB9zJkX5i_qZk";

    // Сервисная функция отправки POST/GET команд
    async function supabaseFetch(endpoint, options = {}) {
        const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
        const headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": options.prefer || "return=representation"
        };
        
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Supabase Error: ${errorText}`);
        }
        return await response.json();
    }

    const CyberDB = {
        // РЕГИСТРАЦИЯ
        async registerUser(username, password) {
            const cleanUser = username.trim();
            if(cleanUser.toLowerCase() === 'admin21') {
                throw new Error("Идентификатор зарезервирован системой безопасности.");
            }

            // Проверяем, есть ли такой ник в глобальной базе данных
            const existing = await supabaseFetch(`users?username=eq.${encodeURIComponent(cleanUser)}`, { method: "GET" });
            if (existing && existing.length > 0) {
                throw new Error("ОШИБКА: Данный логин уже занят другим оператором!");
            }

            // Генерируем уникальный 8-значный Bank ID
            let techId = "";
            let unique = false;
            while(!unique) {
                techId = Math.floor(10000000 + Math.random() * 90000000).toString();
                const checkId = await supabaseFetch(`users?tech_id=eq.${techId}`, { method: "GET" });
                if(checkId.length === 0) unique = true;
            }

            // Запись в облако
            const payload = {
                username: cleanUser,
                password: password,
                tech_id: techId,
                balance: 0.00,
                is_banned: false,
                ban_code: ""
            };

            return await supabaseFetch("users", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        },

        // ВХОД В СИСТЕМУ
        async loginUser(username, password) {
            const cleanUser = username.trim();
            
            // Проверка на жестко зашитого админа
            if (cleanUser === "admin21" && password === "admin210412") {
                return { username: "admin21", isAdmin: true };
            }

            const data = await supabaseFetch(`users?username=eq.${encodeURIComponent(cleanUser)}&password=eq.${encodeURIComponent(password)}`, { method: "GET" });
            if (!data || data.length === 0) {
                throw new Error("КВАНТОВАЯ ОШИБКА: Неверный логин или крипто-пароль!");
            }

            const user = data[0];
            if (user.is_banned) {
                throw new Error(`ВХОД ЗАПРЕЩЕН: Ваша консоль заблокирована.\nКод блокировки: ${user.ban_code}`);
            }

            return { username: user.username, isAdmin: false };
        },

        // ПОЛУЧЕНИЕ ДАННЫХ ЮЗЕРА
        async getUserData(username) {
            const data = await supabaseFetch(`users?username=eq.${encodeURIComponent(username)}`, { method: "GET" });
            return data.length > 0 ? data[0] : null;
        },

        // ИСТОРИЯ ТРАНЗАКЦИЙ СЕТИ
        async getTransactionHistory(username) {
            const encUser = encodeURIComponent(username);
            return await supabaseFetch(`transactions?or=(sender.eq.${encUser},receiver.eq.${encUser})&order=created_at.desc`, { method: "GET" });
        },

        // КВАНТОВЫЙ МЕЖБАНКОВСКИЙ ПЕРЕВОД
        async transferFunds(senderUsername, targetTechId, amount) {
            if (amount <= 0) throw new Error("Сумма операции должна быть положительной.");

            // Ищем отправителя в сети
            const senderData = await this.getUserData(senderUsername);
            if (!senderData) throw new Error("Отправитель не обнаружен в ядре.");
            if (senderData.balance < amount) throw new Error("НЕДОСТАТОЧНО СРЕДСТВ ДЛЯ ПРОВЕДЕНИЯ ТРАНЗАКЦИИ.");

            // Ищем получателя по его Bank ID (8 знаков)
            const receiverArray = await supabaseFetch(`users?tech_id=eq.${targetTechId.trim()}`, { method: "GET" });
            if (!receiverArray || receiverArray.length === 0) {
                throw new Error("АДРЕСАТ НЕ НАЙДЕН: Проверьте корректность Bank ID!");
            }
            const receiverData = receiverArray[0];

            if (senderData.username === receiverData.username) {
                throw new Error("Запрещено переводить средства самому себе.");
            }

            // Проводим списание и зачисление
            const newSenderBalance = parseFloat(senderData.balance) - amount;
            const newReceiverBalance = parseFloat(receiverData.balance) + amount;

            await supabaseFetch(`users?id=eq.${senderData.id}`, {
                method: "PATCH",
                body: JSON.stringify({ balance: newSenderBalance })
            });

            await supabaseFetch(`users?id=eq.${receiverData.id}`, {
                method: "PATCH",
                body: JSON.stringify({ balance: newReceiverBalance })
            });

            // Логируем перевод в глобальный архив
            const txPayload = {
                sender: senderData.username,
                receiver: receiverData.username,
                amount: amount
            };
            await supabaseFetch("transactions", { method: "POST", body: JSON.stringify(txPayload) });
        },

        // АДМИНКА: ВСЕ ЮЗЕРЫ
        async getAllUsers() {
            return await supabaseFetch("users?order=username.asc", { method: "GET" });
        },

        // АДМИНКА: ИЗМЕНЕНИЕ БАЛАНСА
        async updateBalance(username, amount, isGive) {
            const userData = await this.getUserData(username);
            if (!userData) return;

            let currentBal = parseFloat(userData.balance);
            let newBal = isGive ? (currentBal + amount) : (currentBal - amount);
            if (newBal < 0) newBal = 0;

            await supabaseFetch(`users?id=eq.${userData.id}`, {
                method: "PATCH",
                body: JSON.stringify({ balance: newBal })
            });
        },

        // АДМИНКА: ЗАБАНИТЬ
        async banUser(username, code) {
            const userData = await this.getUserData(username);
            if (!userData) return;
            await supabaseFetch(`users?id=eq.${userData.id}`, {
                method: "PATCH",
                body: JSON.stringify({ is_banned: true, ban_code: code })
            });
        },

        // АДМИНКА: РАЗБАНИТЬ
        async unbanUser(username) {
            const userData = await this.getUserData(username);
            if (!userData) return;
            await supabaseFetch(`users?id=eq.${userData.id}`, {
                method: "PATCH",
                body: JSON.stringify({ is_banned: false, ban_code: "" })
            });
        },

        // АДМИНКА: УДАЛИТЬ С СЕРВЕРА
        async deleteUser(username) {
            const userData = await this.getUserData(username);
            if (!userData) return;
            await supabaseFetch(`users?id=eq.${userData.id}`, { method: "DELETE" });
        }
    };

    window.CyberDB = CyberDB;
})();
