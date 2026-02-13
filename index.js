const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot läuft!");
});

app.listen(process.env.PORT, () => {
  console.log("Webserver läuft.");
});
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

const WEEKLY_REQUIREMENT = 1600;
let data = {};

if (fs.existsSync('data.json')) {
    data = JSON.parse(fs.readFileSync('data.json'));
}

function saveData() {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

client.on('messageCreate', message => {
    if (message.author.bot) return;
    
const allowedRoles = ["Leitung", "Manager"];

    const hasPermission = message.member.roles.cache.some(role =>
        allowedRoles.includes(role.name)
    );

    if (!hasPermission) {
        return; // Stoppt alle Commands für andere
    }

    const args = message.content.split(" ");

    // ABGABE
    if (args[0] === "!abgabe") {
        const user = message.mentions.users.first();
        const amount = parseInt(args[2]);

        if (!user || isNaN(amount)) {
            return message.reply("Benutzung: !abgabe @User 400");
        }

        if (!data[user.id]) data[user.id] = 0;
        data[user.id] += amount;

        saveData();

        message.channel.send(`${user.username} hat jetzt ${data[user.id]} Metall abgegeben.`);
    }

    // STATUS
    if (args[0] === "!status") {
        let response = "📊 Wochenstatus:\n\n";

        message.guild.members.cache.forEach(member => {
            if (member.user.bot) return;

            const amount = data[member.id] || 0;

            if (amount >= WEEKLY_REQUIREMENT) {
                response += `✅ ${member.user.username} (${amount}/1600)\n`;
            } else {
                response += `❌ ${member.user.username} (${amount}/1600)\n`;
            }
        });

        message.channel.send(response);
    }

    // LAGER
    if (args[0] === "!lager") {
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        message.channel.send(`📦 Gesamtbestand diese Woche: ${total} Metall`);
    }

    // NEUE WOCHE
    if (args[0] === "!neuewoche") {
        data = {};
        saveData();
        message.channel.send("🔄 Neue Woche gestartet. Alle Abgaben wurden zurückgesetzt.");
    }
});

client.once('ready', () => {
    console.log(`Bot ist online als ${client.user.tag}`);
});

client.login(process.env.TOKEN);


