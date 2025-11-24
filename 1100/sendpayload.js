
// sendpayload.js (FINAL VERSION)
// - No more repeated IP prompt
// - Asks ONLY ONCE if auto-detect failed
// - Saves IP permanently in localStorage
// - Uses offline cache if available
// - Sends payload to GoldHEN BinServer (port 9021)

// Auto-detect helper (kept simple)
async function tryDetectPS4() {
    const candidates = [];

    // Common LAN subnets
    ['192.168.1.', '192.168.0.', '10.0.0.'].forEach(prefix => {
        for (let i = 1; i <= 50; i++) {   // RANGE DIPERLUAS
            candidates.push(prefix + i);
        }
    });

    for (const ip of candidates) {
        try {
            await fetch("http://" + ip + ":9021/ping", { method: "GET", mode: "no-cors" });
            return ip; // sukses
        } catch (e) {}
    }
    return null; // gagal detect
}


// ========== MAIN SENDER FUNCTION ==========
async function send(path) {
    // --- STEP 1: get saved IP (if any) ---
    let ip = localStorage.getItem('ps4ip');

    // --- STEP 2: if IP not saved, try auto-detect ---
    if (!ip || ip.trim() === "") {

        // coba deteksi otomatis
        document.getElementById('payload-desc').textContent = "Detecting PS4 IP...";
        const detected = await tryDetectPS4();

        if (detected) {
            ip = detected;
            localStorage.setItem('ps4ip', ip);
        } else {
            // fallback: tanya IP sekali saja
            const ask = prompt("Enter your PS4 IP address:");
            if (!ask) {
                alert("IP is required.");
                return;
            }
            ip = ask.trim();
            localStorage.setItem('ps4ip', ip);   // SIMPAN PERMANEN
        }
    }

    // --- STEP 3: Fetch payload from cache/server ---
    try {
        document.getElementById('progress-visible').textContent = "Loading: " + path;

        const r = await fetch(path, { cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);

        const payloadBuffer = await r.arrayBuffer();

        // --- STEP 4: Send to GoldHEN BinServer ---
        const urlSend = "http://" + ip + ":9021/sendpayload";
        document.getElementById('progress-visible').textContent = "Sending to PS4...";

        const sendResp = await fetch(urlSend, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: payloadBuffer
        });

        if (sendResp.ok) {
            alert("Payload sent successfully!\n" + path);
            document.getElementById('done').textContent = "Pass = 1";
        } else {
            alert("Failed to send payload.\nStatus: " + sendResp.status);
            document.getElementById('fail').textContent = "Fail = 1";
        }

    } catch (err) {
        alert("Error sending payload:\n" + err);
        document.getElementById('fail').textContent = "Fail = 1";
    } finally {
        document.getElementById('progress-visible').textContent = "Idle";
    }
}

