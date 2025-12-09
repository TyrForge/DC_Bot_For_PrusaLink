import DigestFetch from "digest-fetch";
import 'dotenv/config';

const client = new DigestFetch(process.env.USERNAME, process.env.PASSWORD);

async function getPrinterStatus() {
    const res = await client.fetch(`http://${process.env.PRINTER_IP}/api/v1/status`);

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
}

getPrinterStatus()
    .then(status => {
        console.log("Printer state:", status.printer.state);

        if (status.job) {
            console.log("Progress:", status.job.progress + "%");
            console.log("Time printed:", status.job.time_printing, "sec");
            console.log("Time remaining:", status.job.time_remaining, "sec");
        } else {
            console.log("No active job");
        }
    })
    .catch(err => {
        console.error("PrusaLink error:", err);
    });
