#!/usr/bin/env node
/**
 * Patches @expo/cli so that EXPO_ANONYMOUS=1 makes tryGetUserAsync() return null
 * (proceed anonymously) without prompting. Used by npm run start:go.
 */
const path = require('path');
const fs = require('fs');

const actionsPath = path.join(
  __dirname,
  '../node_modules/expo/node_modules/@expo/cli/build/src/api/user/actions.js'
);

const SEARCH = `async function tryGetUserAsync() {
    const user = await (0, _user.getUserAsync)().catch(()=>null);`;

const REPLACEMENT = `async function tryGetUserAsync() {
    if (process.env.EXPO_ANONYMOUS === '1' || process.env.EXPO_ANONYMOUS === 'true') {
        return null;
    }
    const user = await (0, _user.getUserAsync)().catch(()=>null);`;

try {
  let content = fs.readFileSync(actionsPath, 'utf8');
  if (content.includes('EXPO_ANONYMOUS')) {
    return; // already patched
  }
  if (!content.includes(SEARCH)) {
    console.warn('patch-expo-anonymous: pattern not found, skipping (expo version may have changed)');
    return;
  }
  content = content.replace(SEARCH, REPLACEMENT);
  fs.writeFileSync(actionsPath, content);
} catch (e) {
  if (e.code === 'ENOENT') {
    return; // expo not installed yet
  }
  throw e;
}
