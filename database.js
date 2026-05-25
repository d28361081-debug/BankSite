/**
 * TRUSTIX KERNEL DATABASE INTERFACE (LocalStorage Virtual Simulation)
 */

const DB = {
    getRawData: function() {
        try {
            let data = localStorage.getItem('trustix_matrix_db');
            if (!data) {
                const initialDB = {
                    users: {
                        "admin21": {
                            username: "admin21",
                            password: "admin210412",
                            bankId: "MASTER_CORE",
                            balance: Infinity,
                            isBanned: false,
                            isAdmin: true
                        }
                    },
                    transactions: []
                };
                localStorage.setItem('trustix_matrix_db', JSON.stringify(initialDB));
                return initialDB;
            }
            return JSON.parse(data);
        } catch (e) {
            console.error("Storage Matrix Error, creating fallback database", e);
            return { users: {}, transactions: [] };
        }
    },

    saveRawData: function(data) {
        try {
            localStorage.setItem('trustix_matrix_db', JSON.stringify(data));
        } catch (e) {
            console.error("Failed to write to neural storage", e);
        }
    },

    findUser: function(username) {
        const db = this.getRawData();
        return db.users[username] || null;
    },

    findUserById: function(bankId) {
        const db = this.getRawData();
        return Object.values(db.users).find(u => u.bankId === bankId) || null;
    },

    createUser: function(username, password) {
        const db = this.getRawData();
        if (db.users[username]) return false;

        let uniqueId;
        while (true) {
            uniqueId = Math.floor(10000000 + Math.random() * 90000000).toString();
            if (!Object.values(db.users).some(u => u.bankId === uniqueId)) break;
        }

        db.users[username] = {
            username: username,
            password: password,
            bankId: uniqueId,
            balance: 0.00,
            isBanned: false,
            isAdmin: false
        };

        this.saveRawData(db);
        return db.users[username];
    },

    updateBalance: function(bankId, newBalance) {
        const db = this.getRawData();
        const user = Object.values(db.users).find(u => u.bankId === bankId);
        if (user) {
            if (user.isAdmin) return; 
            db.users[user.username].balance = parseFloat(newBalance);
            this.saveRawData(db);
        }
    },

    setBanStatus: function(bankId, status) {
        const db = this.getRawData();
        const user = Object.values(db.users).find(u => u.bankId === bankId);
        if (user && !user.isAdmin) {
            db.users[user.username].isBanned = status;
            this.saveRawData(db);
            return true;
        }
        return false;
    },

    deleteUser: function(bankId) {
        const db = this.getRawData();
        const user = Object.values(db.users).find(u => u.bankId === bankId);
        if (user && !user.isAdmin) {
            delete db.users[user.username];
            this.saveRawData(db);
            return true;
        }
        return false;
    },

    addTransaction: function(senderId, senderName, receiverId, receiverName, amount) {
        const db = this.getRawData();
        const newTx = {
            id: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            timestamp: new Date().toLocaleString(),
            senderId,
            senderName,
            receiverId,
            receiverName,
            amount: parseFloat(amount)
        };
        db.transactions.unshift(newTx);
        this.saveRawData(db);
    },

    getTransactionsForUser: function(bankId) {
        const db = this.getRawData();
        return db.transactions.filter(tx => tx.senderId === bankId || tx.receiverId === bankId);
    }
};
