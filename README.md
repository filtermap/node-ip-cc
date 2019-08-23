# node-ip-cc

## require

- Node.js
- Yarn
- SQLite 3

## install

```sh
git clone <this repository>
cd ./node-ip-cc
yarn
```

## download the latest RIR statistics files and make the databases

```sh
yarn download
```

## search CC by IP addresss

```sh
yarn start -a 192.168.0.1
# multiple addresses
yarn start -a 192.168.0.1 -a 192.168.0.2
# get addresses from files
yarn start -f addresses.txt -f addresses2.txt
```

## help

```sh
yarn start -h
```

## test

```sh
yarn test
```
