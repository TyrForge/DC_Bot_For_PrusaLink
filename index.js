import 'dotenv/config';
import { Client,GatewayIntentBits,Partials,ActionRowBuilder,ButtonBuilder,ButtonStyle,Events } from 'discord.js';
import { getJobStatus, cancel_job } from './job_status.js';
import { getPrinterStatus } from './printer_status.js';
import { formatduration } from './time_calc.js';
import { start_webapp } from './app.js';

const PREFIX = '!';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});


client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const channelId = process.env.DEFAULT_CHANNEL;
    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased()) {
        console.error("Invalid channel");
        return;
    }

    const row = new ActionRowBuilder().addComponents(
         /* new ButtonBuilder()
            .setCustomId("camera")
            .setLabel("Live Camera")
            .setStyle(ButtonStyle.Primary), */

        new ButtonBuilder()
            .setCustomId("printer_status")
            .setLabel("Printer Status")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("job_status")
            .setLabel("Job Status")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("cancel_job")
            .setLabel("Cancel Current Job")
            .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
        content: "Commands:",
        components: [row]
    });
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;
 
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

/* Typical commands */

    if (command === 'test') {
        if (message.member.roles.cache.has(process.env.ALLOWED_ROLE)) {
            return message.reply("hello")
        } else {
            return message.reply("No permission")
        }
    }
    

    if (command === 'ping') {
        return message.reply(`Current Ping is: ${client.ws.ping}ms`);
    }

    if(command === 'help')
        return message.reply(`
            Commands:
            !printer_status
            !job_status
            !cancel_job
            !buttons
            `)

    if (command === 'printer_status'){
        try {
            const printer_status = await getPrinterStatus(5000);
            const job_status = await getJobStatus(5000)

            await message.reply({
                content: `
                Current Printer status: ${printer_status.printer.state} 
                Current Printer Bed temp: ${printer_status.printer.temp_bed} 
                Current Printer Nozzle temp: ${printer_status.printer.temp_nozzle}
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


    if(command === 'job_status'){
        const job_status = await getJobStatus(5000)
        

        if (job_status === null) {
            await message.reply({
                content: `No job`,
                ephemeral: true,
            }); 
        } else if(job_status !== null) {
            const remining = formatduration(job_status.time_remaining)
            await message.reply({
                content: `
                Current Job Status: ${job_status.file.name}
                Current progress: ${job_status.progress}%
                Current Time Remaining: ${remining}
                `,
            ephemeral: true,
        });
        }
    }

    if(command === 'cancel_job') {
        const job_status = await getJobStatus(5000)


        if (job_status === null){
            await message.reply({
                content: `No job active`,
                ephemeral: true,
            });
        } else if (job_status !== null){
            const job_id = job_status.id
            await cancel_job(5000, job_id)
            await message.reply({
                content: `Job with the id of ${job_id} cancelled`,
                ephemeral: true,
        });
        }
    }



/* Buttons */

    if (command === 'buttons') {
        const row = new ActionRowBuilder().addComponents(
            /* new ButtonBuilder()
                .setCustomId('camera')
                .setLabel('Live Camera')
                .setStyle(ButtonStyle.Primary), */

            new ButtonBuilder()
                .setCustomId('printer_status')
                .setLabel('Printer Status')
                .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                .setCustomId('job_status')
                .setLabel('Job Status')
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

        if (job_status === null){
            await interaction.reply({
                content: `No job active`,
                ephemeral: true,
            });
        } else if (job_status !== null){
            const job_id = job_status.id
            await cancel_job(5000, job_id)
            await interaction.reply({
                content: `Job with the id of ${job_id} cancelled`,
                ephemeral: true,
        });
        }
        

    }

    if (interaction.customId === 'job_status') {   
        const job_status = await getJobStatus(5000)
        

        if (job_status === null) {
            await interaction.reply({
                content: `No job`,
                ephemeral: true,
            }); 
        } else if(job_status !== null) {
            const remining = formatduration(job_status.time_remaining)
            await interaction.reply({
                content: `
                Current Job Status: ${job_status.file.name}
                Current progress: ${job_status.progress}%
                Current Time Remaining: ${remining}
                `,
            ephemeral: true,
        });
        }
    }
});

client.login(process.env.TOKEN);


