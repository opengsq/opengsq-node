#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
    .name('opengsq')
    .description('A CLI tool for OpenGSQ')
    .version('1.0.0');

// TODO: create command line

program.parse(process.argv);