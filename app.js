import express from 'express';
import { spawn } from 'child_process';

export async function start_webapp(app = express(), PORT = 8080, clients = []) {
    
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



    const ffmpeg = spawn('ffmpeg', [
        '-f', 'dshow',
        '-i', 'video=Brio 100', /* MAKE SURE THIS IS SET TO THE RIGHT CAMERA, IF UNSURE RUN "ffmpeg -list_devices true -f dshow -i dummy" IT SHOULD SHOW ALL OUTPUTS */
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

}
