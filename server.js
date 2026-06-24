const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to fetch Claude usage
app.get('/api/usage', (req, res) => {
    exec('echo "/usage" | claude -p', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Failed to fetch usage' });
        }

        // Parse stdout
        // Expected format:
        // Current session: 9% used · resets Jun 23 at 11:50am (America/Detroit)
        // Current week (all models): 15% used · resets Jun 25 at 6:59am (America/Detroit)
        
        const fs = require('fs');
        fs.writeFileSync('claude_output.log', stdout);
        
        let sessionUsage = null;
        let sessionReset = null;
        let weekUsage = null;
        let weekReset = null;

        // Strip ANSI escape codes
        const cleanStdout = stdout.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

        const sessionMatch = cleanStdout.match(/Current session:[^0-9]*(\d+)%/);
        if (sessionMatch && sessionMatch[1]) {
            sessionUsage = parseInt(sessionMatch[1], 10);
        }

        const sessionResetMatch = cleanStdout.match(/Current session.*resets\s+(.*?)(?:\n|$)/);
        if (sessionResetMatch && sessionResetMatch[1]) {
            sessionReset = sessionResetMatch[1].trim();
        }

        const weekMatch = cleanStdout.match(/Current week[^:]*:[^0-9]*(\d+)%/);
        if (weekMatch && weekMatch[1]) {
            weekUsage = parseInt(weekMatch[1], 10);
        }

        const resetMatch = cleanStdout.match(/Current week.*resets\s+(.*?)(?:\n|$)/);
        if (resetMatch && resetMatch[1]) {
            weekReset = resetMatch[1].trim();
        }

        res.json({
            sessionUsage,
            sessionReset,
            weekUsage,
            weekReset
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
