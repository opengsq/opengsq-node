# OpenGSQ Node Library

[![Node.js Build](https://github.com/opengsq/opengsq-node/actions/workflows/node-build.yml/badge.svg)](https://github.com/opengsq/opengsq-node/actions/workflows/node-build.yml)
![NPM Type Definitions](https://img.shields.io/npm/types/%40opengsq%2Fopengsq-node)
[![NPM Version](https://img.shields.io/npm/v/%40opengsq%2Fopengsq-node)](https://www.npmjs.com/package/@opengsq/opengsq-node)
![NPM Downloads](https://img.shields.io/npm/dw/%40opengsq%2Fopengsq-node)
![NPM Downloads](https://img.shields.io/npm/d18m/%40opengsq%2Fopengsq-node)
![Documentation](https://img.shields.io/badge/docs-typedoc-blue)
[![GitHub license](https://img.shields.io/github/license/opengsq/opengsq-node)](https://github.com/opengsq/opengsq-node/blob/main/LICENSE)

The OpenGSQ Node library provides a convenient way to query servers from applications written in the TypeScript language.

## Supported Protocols

The library supports a wide range of protocols. Here are some examples:

```ts
import { Source } from '@opengsq/opengsq';
```

## Installation

The recommended installation method is using [pip](http://pip-installer.org/):

```sh
npm install -S @opengsq/opengsq
```

## Usage

Here’s an example of how to query a server using the Source protocol:

```ts
import { Source } from "@opengsq/opengsq";

async function main() {
    const source = new Source("91.216.250.10", 27015);

    const info = await source.getInfo();
    console.log("Info:", info);

    const players = await source.getPlayers();
    console.log("Players:", players);

    const rules = await source.getRules();
    console.log("Rules:", rules);
}

main();
```

## Contributing
Contributions are welcome! Please feel free to submit pull requests or open issues.

![https://github.com/opengsq/opengsq-node/graphs/contributors](https://contrib.rocks/image?repo=opengsq/opengsq-node)

## Stargazers over time

[![Stargazers over time](https://starchart.cc/opengsq/opengsq-node.svg?variant=adaptive)](https://starchart.cc/opengsq/opengsq-node)
