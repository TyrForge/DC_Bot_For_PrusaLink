import 'dotenv/config';

export async function getPrinterStatus(timeoutMs = 5000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(
            `http://${process.env.PRINTER_IP}/api/v1/status`, {
                headers: {
                    "x-Api-Key": process.env.PL_API
                },
                signal: controller.signal
            });

        if (!res.ok) {
            throw Error(`HTTP ${res.status}`);
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
