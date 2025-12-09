export async function safeFetch(res) {
    const text = await res.text();

    if(!text || text.trim() === "") {
        return null;
    }
    
    try {
        return JSON.parse(text);
    } catch(err) {
        throw new Error(`Invalid JSON response`)
    }
}