import ipAddress from "ip-address";
import * as database from "./database";

export default function ipAddressToCC(address: string): string | undefined {
  const ipv4 = new ipAddress.Address4(address);
  if (ipv4.isValid()) {
    const addressInteger = parseInt(ipv4.bigInteger().toString(), 10);
    return database.selectCCFromIPv4CCsWithAddressInteger(addressInteger);
  }
  const ipv6 = new ipAddress.Address6(address);
  if (ipv6.isValid()) {
    const addressIntegerString = ipv6.bigInteger().toString();
    return database.selectCCFromIPv6CCsWithAddressIntegerString(
      addressIntegerString
    );
  }
}
