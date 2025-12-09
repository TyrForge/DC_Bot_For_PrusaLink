export function formatduration(seconds){
    if(seconds == null || seconds < 0) return "Unkown";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if(h > 0) parts.push(`${h}h`);
    if(m > 0 || h > 0) parts.push(`${m}m`);
    parts.push(`${s}s`)

    return parts.join("")
}
