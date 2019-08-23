import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import fs from "fs";
import iso3166 from "iso-3166-1";
import readline from "readline";
import ipAddressToCC from "./ipAddressToCC";

function main(): void {
  const optionDefinitions = [
    {
      name: "address",
      alias: "a",
      type: String,
      multiple: true,
      description: "IP address (IPv4 or IPv6)."
    },
    {
      name: "file",
      alias: "f",
      type: String,
      multiple: true,
      description: "Obtain IP addresses from the files, one per line."
    },
    {
      name: "country",
      alias: "c",
      type: Boolean,
      description: "Show country names."
    },
    {
      name: "help",
      alias: "h",
      type: Boolean,
      description: "Print this list and exit."
    }
  ];
  const options = commandLineArgs(optionDefinitions);
  if (options.help) {
    const sections = [
      {
        header: "Usage:",
        content: "yarn start [options]"
      },
      {
        header: "Available Options:",
        optionList: optionDefinitions
      }
    ];
    const usage = commandLineUsage(sections);
    console.log(usage);
    return;
  }
  const addresses: string[] = options.address;
  if (addresses) {
    addresses.forEach(address => {
      const cc = ipAddressToCC(address);
      console.log(
        `${address},${cc || ""}${
          options.country ? `,${iso3166.whereAlpha2(cc).country}` : ""
        }`
      );
    });
  }
  const files: string[] = options.file;
  if (files) {
    files.forEach(file => {
      const readStream = fs.createReadStream(file);
      const readlineInterface = readline.createInterface({ input: readStream });
      readlineInterface.on("line", line => {
        const cc = ipAddressToCC(line);
        console.log(
          `${line},${cc || ""}${
            options.country ? `,${iso3166.whereAlpha2(cc).country}` : ""
          }`
        );
      });
    });
  }
}

main();
