const { spawn } = require('child_process');
const path = require('path');

/**
 * Compares two face images using Python script and returns similarity score
 * @param {string} image1Path - Path to first image
 * @param {string} image2Path - Path to second image  
 * @returns {Promise<number>} Similarity score between 0 and 1
 */
function compareFacesPython(image1Path, image2Path) {
    return new Promise((resolve, reject) => {
        // Get absolute path to Python script
        const scriptPath = path.join(__dirname, 'faceComparison.py');

        // Spawn Python process
        const pythonProcess = spawn('python', [
            scriptPath,
            image1Path,
            image2Path
        ]);

        let result = '';

        // Collect data from script output
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        // Handle errors
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
            reject(new Error(data.toString()));
        });

        // Process completed
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python process exited with code ${code}`));
                return;
            }

            // Extract similarity score from output
            const match = result.match(/Similarity Score: ([\d.]+)/);
            if (match && match[1]) {
                resolve(parseFloat(match[1]));
            } else {
                reject(new Error('Could not parse similarity score from Python output'));
            }
        });
    });
}

module.exports = {
    compareFacesPython
};
