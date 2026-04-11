#!/usr/bin/env node
// Bundle entry point for the GitHub Action.
// ncc traces all imports from cli.mjs and produces a single-file dist.
import '../../../src/cli.mjs';
