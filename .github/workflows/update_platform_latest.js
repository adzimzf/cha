const fs = require('fs');
const core = require('@actions/core');

try {
    const version = core.getInput('version');
    const arch = core.getInput('arch');

    // Read and parse JSON file
    const jsonPath = './latest.json';
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Update version and publication date
    data.version = version;
    data.pub_date = new Date().toISOString();

    // Determine target platform key
    const [targetArch] = arch.split('-');
    const platformKey = `darwin-${targetArch}`;

    // Read signature file
    const sigPath = `./src-tauri/target/${targetArch}-apple-darwin/release/bundle/macos/Cha.app.tar.gz.sig`;
    const signature = fs.readFileSync(sigPath, 'utf8').trim();

    // Construct new URL
    const newUrl = `https://github.com/adzimzf/cha/releases/download/v${version}/Cha_${version}_${targetArch}.dmg`;

    // Update platform entry
    data.platforms[platformKey] = {
        signature: signature,
        url: newUrl
    };

    // Write updated JSON back to file
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log('Successfully updated latest.json');

} catch (error) {
    core.setFailed(error.message);
}