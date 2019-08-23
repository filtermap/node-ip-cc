declare module "iso-3166-1";

declare type IPv4CC = {
  firstAddressInteger: number;
  lastAddressInteger: number;
  cc: string;
};

declare type IPv6CC = {
  firstAddressIntegerString: string;
  lastAddressIntegerString: string;
  cc: string;
};
