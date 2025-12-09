import 'dotenv/config';
import { safeFetch } from './quickjsonsafethingy.js';

export async function getJobStatus(timeoutMs = 5000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(
            `http://${process.env.PRINTER_IP}/api/v1/job`, {
                headers: {
                    "x-Api-Key": process.env.PL_API
                },
                signal: controller.signal
            });
        if (res === 204){
            return null;
        }
        if (!res.ok) {
            throw Error(`HTTP ${res.status}`);
        }

        return await safeFetch(res);

    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error("PrusaLink request timed out");
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

export async function cancel_job(timeoutMs = 5000, job_id) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    if(!job_id) {
        throw new Error("Job ID required")
    }

    try {
        const res = await fetch(
            `http://${process.env.PRINTER_IP}/api/v1/job/${job_id}`, {
                method: "DELETE",
                headers: {
                    "x-Api-Key": process.env.PL_API
                },
                signal: controller.signal
            });
        if (res === 204){
            return true;
        }

        if (res == 404){
            throw new Error(`Job with ${job_id} could not be found`)
        }

        if (res == 409){
            throw new Error(`Job with ${job_id} cannot be stopped currently`)
        }

        if (!res.ok) {
            throw Error(`HTTP ${res.status}`);
        }

        return await safeFetch(res);

    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error("PrusaLink request timed out");
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }

}

const job = await getJobStatus(5000)
console.log(job)