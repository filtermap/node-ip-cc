import fs from "fs";
import readline from "readline";
import FTP from "ftp";
import ipAddress from "ip-address";
import * as database from "./database";

type RIRStatisticsFile = {
  name: string;
  url: string;
};

const rirStatisticsFiles: RIRStatisticsFile[] = [
  {
    name: "delegated-arin-extended-latest",
    url: "ftp://ftp.arin.net/pub/stats/arin/delegated-arin-extended-latest"
  },
  {
    name: "delegated-ripencc-extended-latest",
    url:
      "ftp://ftp.ripe.net/pub/stats/ripencc/delegated-ripencc-extended-latest"
  },
  {
    name: "delegated-apnic-extended-latest",
    url: "ftp://ftp.apnic.net/pub/stats/apnic/delegated-apnic-extended-latest"
  },
  {
    name: "delegated-lacnic-extended-latest",
    url:
      "ftp://ftp.lacnic.net/pub/stats/lacnic/delegated-lacnic-extended-latest"
  },
  {
    name: "delegated-afrinic-extended-latest",
    url:
      "ftp://ftp.afrinic.net/pub/stats/afrinic/delegated-afrinic-extended-latest"
  }
];

async function downloadRIRStatisticsFiles(): Promise<void[]> {
  return Promise.all(
    rirStatisticsFiles.map(
      (file): Promise<void> =>
        new Promise((resolve): void => {
          const url = new URL(file.url);
          const ftp = new FTP();
          ftp.on("ready", () => {
            ftp.get(url.pathname, (err, stream) => {
              console.log(`downloading ${url.pathname}`);
              if (err) throw err;
              stream.pipe(fs.createWriteStream(file.name, { flags: "w" }));
              stream.once("close", () => {
                console.log(`downloaded ${file.name}`);
                ftp.end();
                resolve();
              });
            });
          });
          ftp.connect({ host: url.host });
          console.log(`connected to ${url.host}`);
        })
    )
  );
}

async function writeIPAddressLines(): Promise<void> {
  database.clear();
  const tmpIPv4CCs: IPv4CC[] = [];
  const ipv6CCs: IPv6CC[] = [];
  for (const file of rirStatisticsFiles) {
    console.log(`read: ${file.name}`);
    let numberOfLines = 0;
    let numberOfIPv4Records = 0;
    let numberOfIPv6Records = 0;
    await new Promise((resolve): void => {
      const readStream = fs.createReadStream(file.name, { flags: "r" });
      const readlineInterface = readline.createInterface({ input: readStream });
      readlineInterface.on("line", line => {
        numberOfLines++;
        if (/(arin|ripencc|apnic|lacnic|afrinic)\|[A-Z]+\|ipv4/.test(line)) {
          numberOfIPv4Records++;
          const [, cc, , start, value] = line.split("|");
          const firstAddressInteger = parseInt(
            new ipAddress.Address4(start).bigInteger().toString(),
            10
          );
          const lastAddressInteger =
            firstAddressInteger + parseInt(value, 10) - 1;
          tmpIPv4CCs.push({
            firstAddressInteger,
            lastAddressInteger,
            cc
          });
        }
        if (/(arin|ripencc|apnic|lacnic|afrinic)\|[A-Z]+\|ipv6/.test(line)) {
          numberOfIPv6Records++;
          const [, cc, , start, value] = line.split("|");
          const firstAddress = new ipAddress.Address6(`${start}/${value}`);
          const firstAddressIntegerString = firstAddress
            .bigInteger()
            .toString();
          const lastAddressIntegerString = firstAddress
            .endAddress()
            .bigInteger()
            .toString();
          ipv6CCs.push({
            firstAddressIntegerString,
            lastAddressIntegerString,
            cc
          });
        }
      });
      readlineInterface.on("close", () => {
        console.log(`number of lines: ${numberOfLines}`);
        console.log(`number of IPv4 records: ${numberOfIPv4Records}`);
        console.log(`number of IPv6 records: ${numberOfIPv6Records}`);
        resolve();
      });
    });
  }
  console.log(`total number of IPv6 records: ${ipv6CCs.length}`);
  database.insertManyIntoIPv6CC(ipv6CCs);
  const tmpIPv4CCsGroupedByCC: Map<string, IPv4CC[]> = new Map();
  for (const ipv4CC of tmpIPv4CCs) {
    const { cc } = ipv4CC;
    const ipv4CCs = tmpIPv4CCsGroupedByCC.get(cc);
    if (!ipv4CCs) {
      tmpIPv4CCsGroupedByCC.set(cc, [ipv4CC]);
      continue;
    }
    ipv4CCs.push(ipv4CC);
  }
  const ipv4CCs: IPv4CC[] = [];
  for (const tmpIPv4CCs of tmpIPv4CCsGroupedByCC.values()) {
    tmpIPv4CCs.sort((a, b) => a.firstAddressInteger - b.firstAddressInteger);
    let previousIPv4CC = tmpIPv4CCs[0];
    ipv4CCs.push(previousIPv4CC);
    for (let i = 1; i < tmpIPv4CCs.length; i++) {
      const ipv4CC = tmpIPv4CCs[i];
      if (
        previousIPv4CC.lastAddressInteger + 1 ===
        ipv4CC.firstAddressInteger
      ) {
        previousIPv4CC.lastAddressInteger = ipv4CC.lastAddressInteger;
        continue;
      }
      previousIPv4CC = ipv4CC;
      ipv4CCs.push(ipv4CC);
    }
  }
  database.insertManyIntoIPv4CC(ipv4CCs);
  console.log(`total number of IPv4 records: ${tmpIPv4CCs.length}`);
  console.log(`number of aggregated IPv4 records: ${ipv4CCs.length}`);
}

async function main(): Promise<void> {
  await downloadRIRStatisticsFiles();
  await writeIPAddressLines();
}

main();
