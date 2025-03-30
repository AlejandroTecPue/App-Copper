const { exec } = require("child_process");

exec(
  "npx mkcert -install && npx mkcert localhost",
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`Certificado generado:\n${stdout}`);
  }
);
