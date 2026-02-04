const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: '9966',
    database: 'chat_app',
});

client.connect()
    .then(() => {
        console.log('✅ Successfully connected to PostgreSQL!');
        return client.query('SELECT current_database(), current_user, version()');
    })
    .then((res) => {
        console.log('Database:', res.rows[0].current_database);
        console.log('User:', res.rows[0].current_user);
        console.log('Version:', res.rows[0].version);
        return client.end();
    })
    .then(() => {
        console.log('✅ Connection closed successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Connection error:', err.message);
        console.error('Error code:', err.code);
        process.exit(1);
    });
