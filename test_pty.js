const pty = require('node-pty');

function fetchUsage(callback) {
    const ptyProcess = pty.spawn('/bin/bash', ['-c', 'claude'], {
        name: 'xterm-color',
        cols: 120,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
    });

    let output = '';
    let isDone = false;

    ptyProcess.onData((data) => {
        output += data;
        // Check if the output contains the prompt " > " or something indicating it's ready
        if (output.includes('▶') || output.includes('>')) {
            if (!isDone) {
                isDone = true;
                ptyProcess.write('/usage\r');
            }
        }
        
        if (isDone && output.includes('Current week')) {
            // we got it!
            ptyProcess.kill();
            callback(output);
        }
    });

    setTimeout(() => {
        ptyProcess.kill();
        callback(output);
    }, 5000);
}

fetchUsage((out) => console.log("OUTPUT:", out));
