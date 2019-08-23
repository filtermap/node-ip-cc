import betterSqlite3 from "better-sqlite3";

const database = betterSqlite3("database.sqlite");

export function clear(): void {
  database.prepare(`drop table if exists ipv4CCs`).run();
  database.prepare(`drop table if exists ipv6CCs`).run();
  database
    .prepare(
      `create table if not exists ipv4CCs (id integer primary key, firstAddressInteger integer not null, lastAddressInteger integer not null, cc text not null)`
    )
    .run();
  database
    .prepare(
      `create table if not exists ipv6CCs (id integer primary key, firstAddressIntegerString text not null, lastAddressIntegerString text not null, cc text not null)`
    )
    .run();
}

const insertManyIntoIPv4CCTransaction = database.transaction(ipv4CCs => {
  const insertIntoIPv4CCStatement = database.prepare(
    `insert into ipv4CCs (firstAddressInteger, lastAddressInteger, cc) values (:firstAddressInteger, :lastAddressInteger, :cc)`
  );
  for (const ipv4CC of ipv4CCs) {
    insertIntoIPv4CCStatement.run(ipv4CC);
  }
});

const insertManyIntoIPv6CCTransaction = database.transaction(ipv6CCs => {
  const insertIntoIPv6CCStatement = database.prepare(
    `insert into ipv6CCs (firstAddressIntegerString, lastAddressIntegerString, cc) values (:firstAddressIntegerString, :lastAddressIntegerString, :cc)`
  );
  for (const ipv6CC of ipv6CCs) {
    insertIntoIPv6CCStatement.run(ipv6CC);
  }
});

export function insertManyIntoIPv4CC(ipv4CCs: IPv4CC[]): void {
  return insertManyIntoIPv4CCTransaction(ipv4CCs);
}

export function insertManyIntoIPv6CC(ipv6CCs: IPv6CC[]): void {
  return insertManyIntoIPv6CCTransaction(ipv6CCs);
}

export function selectCCFromIPv4CCsWithAddressInteger(
  addressInteger: number
): string | undefined {
  const selectCCFromIPv4CCsWithAddressIntegerStatement = database.prepare(
    `select cc from ipv4CCs where firstAddressInteger <= :addressInteger and lastAddressInteger >= :addressInteger limit 1`
  );
  const row = selectCCFromIPv4CCsWithAddressIntegerStatement.get({
    addressInteger
  });
  return row ? row.cc : undefined;
}

export function selectCCFromIPv6CCsWithAddressIntegerString(
  addressIntegerString: string
): string | undefined {
  const selectCCFromIPv6CCsWithAddressIntegerStatement = database.prepare(
    `select cc from ipv6CCs where firstAddressIntegerString <= :addressIntegerString and lastAddressIntegerString >= :addressIntegerString limit 1`
  );
  const row = selectCCFromIPv6CCsWithAddressIntegerStatement.get({
    addressIntegerString
  });
  return row ? row.cc : undefined;
}
