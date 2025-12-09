import DigestFetch from "digest-fetch";
import 'dotenv/config';

const client = new DigestFetch(process.env.USERNAME, process.env.PASSWORD);

export async function getPrinterStatus(timeoutMs = 5000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await client.fetch(
            `http://${process.env.PRINTER_IP}/api/v1/status`,
            { signal: controller.signal }
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error("PrusaLink request timed out");
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

