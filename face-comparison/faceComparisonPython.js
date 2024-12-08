const { spawn } = require('child_process');
const path = require('path');

/**
 * Compares two face images using Python script and returns similarity score
 * @param {string} image1Path - Path to first image
 * @param {string} image2Path - Path to second image  
 * @returns {Promise<number>} Similarity score between 0 and 1
 */
function compareFacesPython(image1Path, image2Path) {
    console.log('Starting face comparison...');
    console.log(`Image 1 path: ${image1Path}`);
    console.log(`Image 2 path: ${image2Path}`);

    return new Promise((resolve, reject) => {
        // Get absolute path to Python script
        const scriptPath = path.join(__dirname, 'faceComparison.py');
        console.log(`Python script path: ${scriptPath}`);

        // Spawn Python process
        console.log('Spawning Python process...');
        const pythonProcess = spawn('python', [
            scriptPath,
            image1Path,
            image2Path
        ]);

        let result = '';

        // Collect data from script output
        pythonProcess.stdout.on('data', (data) => {
            console.log('Received data from Python script');
            result += data.toString();
        });

        // Handle errors
        pythonProcess.stderr.on('data', (data) => {
            console.error('Error from Python script:');
            console.error(`Python Error: ${data}`);
            reject(new Error(data.toString()));
        });

        // Process completed
        pythonProcess.on('close', (code) => {
            console.log(`Python process completed with code ${code}`);
            
            if (code !== 0) {
                console.error(`Process failed with code ${code}`);
                reject(new Error(`Python process exited with code ${code}`));
                return;
            }

            // Extract similarity score from output
            console.log('Parsing similarity score from output',result);
            //const match = result.match(/Similarity Score: ([\d.]+)/);
            if (result) {
                const score = parseFloat(result);
                console.log(`Successfully parsed similarity score: ${score}`);
                resolve(score);
            } else {
                console.error('Failed to parse similarity score from output');
                reject(new Error('Could not parse similarity score from Python output'));
            }
        });
    });
}

module.exports = {
    compareFacesPython
};
