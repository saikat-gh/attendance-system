const os = require('os');
let glbLocaCode;

const networkInterfaces = os.networkInterfaces();
for (let interface in networkInterfaces) {
  glbLocaCode = networkInterfaces[interface][0].mac;
  break;
/*    console.log(`Interface: ${interface}`);
    console.log(networkInterfaces[interface][0].mac); */
/*        networkInterfaces[interface].forEach(details => {
            console.log(`MAC Address: ${typeof details.mac}`);
  */ 
            
    };
    
    console.log(glbLocaCode) ;


