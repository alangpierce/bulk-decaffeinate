/* eslint-env mocha */
import assert from 'assert';
import { readFile } from 'mz/fs';

import {
  assertFileContents,
  assertFileIncludes,
  assertIncludes,
  runCli,
  runWithTemplateDir,
} from './test-util';

describe('basic CLI', () => {
  it('shows a help message when invoked with no arguments', async function() {
    let {stdout} = await runCli('');
    assertIncludes(stdout, 'Usage:');
    assertIncludes(stdout, 'Commands:');
    assertIncludes(stdout, 'Options:');
  });
});

describe('simple-success', () => {
  it('discovers and runs files', async function() {
    let {stdout} = await runCli('check -d test/examples/simple-success');
    assertIncludes(stdout, 'Doing a dry run of decaffeinate on 2 files...');
    assertIncludes(stdout, 'All checks succeeded');
  });

  it('runs files from the current directory', async function() {
    await runWithTemplateDir('simple-success', async function() {
      let {stdout} = await runCli('check');
      assertIncludes(stdout, 'Doing a dry run of decaffeinate on 2 files...');
      assertIncludes(stdout, 'All checks succeeded');
    });
  });
});

describe('simple-error', () => {
  it('discovers two files and fails on one', async function() {
    let {stdout} = await runCli('check -d test/examples/simple-error');
    assertIncludes(stdout, 'Doing a dry run of decaffeinate on 2 files...');
    assertIncludes(stdout, '1 file failed to convert');

    await assertFileIncludes(
      'decaffeinate-errors.log',
      '===== test/examples/simple-error/error.coffee'
    );

    let results = JSON.parse((await readFile('decaffeinate-results.json')).toString());
    assert.equal(results.length, 2);
    assert.equal(results[0].path, 'test/examples/simple-error/error.coffee');
    assert.notEqual(results[0].error, null);
    assert.equal(results[1].path, 'test/examples/simple-error/success.coffee');
    assert.equal(results[1].error, null);

    await assertFileContents(
      'decaffeinate-successful-files.txt',
      'test/examples/simple-error/success.coffee'
    );
  });
});

describe('file-list', () => {
  it('reads a path file containing two lines, and ignores the other file', async function() {
    let {stdout} = await runCli('check --path-file test/examples/file-list/files-to-decaffeinate.txt');
    assertIncludes(stdout, 'Doing a dry run of decaffeinate on 3 files...');
    assertIncludes(stdout, 'All checks succeeded');
  });
});

describe('specifying individual files', () => {
  it('allows specifying one file', async function() {
    let {stdout} = await runCli('check --file test/examples/simple-success/A.coffee');
    assertIncludes(stdout, 'Doing a dry run of decaffeinate on 1 file...');
    assertIncludes(stdout, 'All checks succeeded');
  });

  it('allows specifying two files', async function() {
    let {stdout} = await runCli(
      `check --file test/examples/simple-success/A.coffee \
        --file test/examples/simple-success/B.coffee`);
    assertIncludes(stdout, 'Doing a dry run of decaffeinate on 2 files...');
    assertIncludes(stdout, 'All checks succeeded');
  });
});

describe('config files', () => {
  it('reads the list of files from a config file', async function() {
    await runWithTemplateDir('simple-config-file', async function() {
      let {stdout, stderr} = await runCli('check');
      assert.equal(stderr, '');
      assertIncludes(stdout, 'Doing a dry run of decaffeinate on 1 file...');
      assertIncludes(stdout, 'All checks succeeded');
    });
  });
});

describe('file filtering', () => {
  it('excludes a file when instructed', async function() {
    await runWithTemplateDir('file-filter', async function() {
      let {stdout, stderr} = await runCli('check');
      assert.equal(stderr, '');
      assertIncludes(stdout, 'Doing a dry run of decaffeinate on 1 file...');
      assertIncludes(stdout, 'All checks succeeded');
    });
  });
});
