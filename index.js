import 'dotenv/config';
import express from 'express';
import { spawn } from 'child_process';
import {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    EmbedBuilder
} from 'discord.js';
import { getJobStatus, cancel_job } from './job_status.js';
import { getPrinterStatus } from './printer_status.js';

const PREFIX = '!';
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});


const app = express();
const PORT = 8080;
let clients = [];



/*Camera stuff and embed into the home page*/
app.get('/', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    clients.push(res);

    req.on('close', () => {
        clients = clients.filter((c) => c !== res);
    });
});

app.get('/', (req, res) => {
    res.send(`
        <html>
        <body>
            <img src="/stream" />
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Web server running at http://localhost:${PORT}`);
});

/* FFMPEG Settings... dont ask me */

const ffmpeg = spawn('ffmpeg', [
    '-f', 'dshow',
    '-i', 'video=Microsoft® LifeCam VX-2000', /* MAKE SURE THIS IS SET TO THE RIGHT CAMERA, IF UNSURE RUN "ffmpeg -list_devices true -f dshow -i dummy" IT SHOULD SHOW ALL OUTPUTS */
    '-vf', 'scale=640:360',
    '-r', '30',
    '-q:v', '5',
    '-f', 'mjpeg',
    'pipe:1',
]);

ffmpeg.stdout.on('data', (chunk) => {
    clients.forEach((res) => {
        res.write(`--frame\r\n`);
        res.write(`Content-Type: image/jpeg\r\n\r\n`);
        res.write(chunk);
        res.write('\r\n');
    });
});






client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;


 
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        return message.reply(`Current Ping is: ${client.ws.ping}ms`);
    }

  /* Early button test */

    if (command === 'buttons') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('camera')
                .setLabel('Live Camera')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('printer_status')
                .setLabel('Printer Status')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('cancel_job')
                .setLabel('Cancel Current Job')
                .setStyle(ButtonStyle.Danger),
        );
        

        return message.channel.send({
        content: 'Commands:',
        components: [row],
        });
    }
});

/* Early button command test */

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'camera') {
        await interaction.reply({
            content: `http://localhost:8080/`,
            ephemeral: true,
        });
    } 

    if (interaction.customId === 'printer_status') {
        try {
            const printer_status = await getPrinterStatus(5000);
            const job_status = await getJobStatus(5000)

            await interaction.reply({
                content: `
                Current Printer status: ${printer_status.printer.state} 
                Current Printer Bed temp: ${printer_status.printer.temp_bed} 
                Current Printer Nozzle temp: ${printer_status.printer.temp_nozzle}
                Current Job Status: ${job_status.file.name}
                Current progress/time remaining: ${job_status.progress}/${job_status.time_printing}
                `,
                ephemeral: true,
            });
        } catch (err) {
            await interaction.reply({
                content: "Printer Unreachable",
                ephemeral: true
            });
            console.error("Printer Status Error:", err.message)
        }

    }

    if (interaction.customId === 'cancel_job') {
        const job_status = await getJobStatus(5000)
        const job_id = job_status.id
        /* await cancel_job(5000, job_id) */
        
        await interaction.reply({
            content: `Job with the id of ${job_id} cancelled`,
            ephemeral: true,
        });
    }
  
});

client.login(process.env.TOKEN);


