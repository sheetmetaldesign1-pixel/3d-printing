const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const postsDir = path.join(__dirname, '../posts');

console.log(`Watching ${postsDir} for changes...`);
console.log('Use Ctrl+C to stop watching.');

let debounceTimer;

// Initial build
runBuild();

fs.watch(postsDir, (eventType, filename) => {
    if (filename && filename.endsWith('.html')) {
        // Debounce to avoid multiple runs for single save
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            console.log(`Detected change in ${filename} (${eventType}). Regenerating blog data...`);
            runBuild();
        }, 500); // Wait 500ms after last change
    }
});

function runBuild() {
    exec('node scripts/generate_blog_data.js', { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
        if (err) {
            console.error('Error regenerating blog data:', err);
            return;
        }
        if (stdout) process.stdout.write(stdout);
        // Filter out sitemap success message to reduce noise if desired, but keeping it is fine
    });
}

// Start the static server
console.log('Starting local server...');
const server = exec('npx serve .', { cwd: path.join(__dirname, '..') });

server.stdout.on('data', (data) => {
    process.stdout.write(data);
});

server.stderr.on('data', (data) => {
    process.stderr.write(data);
});

server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});
