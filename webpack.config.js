const path = require('path');

module.exports = {
    entry: './public/script.mjs', // Your main entry file
    output: {
        path: path.resolve(__dirname, 'public'), // Output directory
        filename: 'bundle.js', // Output bundle filename
    },
    devServer: {
        contentBase: './public', // Serve files from this directory
        port: 3000, // Port for development server
    },
    mode: "development"
};