#!/usr/bin/env node
const { execSync } = require("child_process");
const { exit, cwd } = require("process");
const gettextParser = require("gettext-parser");
const glob = require("glob");
const { join, isAbsolute } = require("path");
const { lstatSync, writeFileSync, readFileSync } = require("fs");

const isDirectory = source => lstatSync(source).isDirectory();

const getTranslationObjects = parsedPo =>
  Object.values(parsedPo.translations[""]).filter(trans => trans.msgid);

const differsFromExisting = (sourceMessage, targetMessage) => {
  // No translation yet
  if (!sourceMessage.msgstr && !targetMessage.msgstr) {
    return false;
  }

  // A msgstr was added - diff
  if (!sourceMessage.msgstr || !targetMessage.msgstr) {
    return true;
  }

  // If the msgstr doesn't match in length.
  if (
    sourceMessage.msgstr.length !==
    (targetMessage.msgstr ? targetMessage.msgstr.length : 0)
  ) {
    return true;
  }

  // Check if one of the msgstr differs
  return sourceMessage.msgstr.some((str, i) => str !== targetMessage.msgstr[i]);
};

const createDiffJSON = (source, target) => {
  const { translations, ...meta } = source;

  const targetTranslations = getTranslationObjects(target);
  const existingTranslation = new Map();
  targetTranslations.forEach(trans => {
    existingTranslation.set(trans.msgid, trans);
  });

  const sourceTranslations = getTranslationObjects(source);

  const resultTranslations = sourceTranslations.reduce(
    (result, source) => {
      if (!existingTranslation.has(source.msgid)) {
        result[""][source.msgid] = source;
        return result;
      }

      const existing = existingTranslation.get(source.msgid);

      if (differsFromExisting(source, existing)) {
        result[""][source.msgid] = source;
      }

      return result;
    },
    {
      "": {}
    }
  );

  return {
    ...meta,
    translations: resultTranslations
  };
};

const extractDiff = argv => {
  const { dir, branch } = argv;

  if (isAbsolute(dir)) {
    console.error(
      `Absolute paths are not supported. Make sure you specify a path relative to the git directory`
    );
    exit(1);
  }

  const poPath = join(cwd(), dir);
  if (!isDirectory(poPath)) {
    console.error(
      `Directory (${poPath}) specified under -d flag (${dir}) is not a valid directory.`
    );
    exit(1);
  }

  const poFiles = glob.sync(join(poPath, "**/*.po"));
  if (!poFiles.length) {
    console.error(`No .po files found in directory ${poPath}`);
    exit(1);
  }

  poFiles.forEach(poFile => {
    const gitPath = poFile.replace(cwd(), ".");
    const sourcePo = readFileSync(poFile).toString();
    const targetPo = execSync(` git show ${branch}:${gitPath}`).toString();

    const source = gettextParser.po.parse(sourcePo);
    const target = gettextParser.po.parse(targetPo);

    const resultJSON = createDiffJSON(source, target);

    const diffedPo = gettextParser.po.compile(resultJSON);
    writeFileSync(poFile, diffedPo);
  });
};

require("yargs")
  .scriptName("podiff")
  .usage("$0 [options]")
  .command(
    "$0",
    "extracts the diff between a PO file on a branch against that on another branch",
    {
      dir: {
        type: "string",
        alias: "d",
        default: "./",
        required: true,
        description: "directory where locales are located"
      },
      branch: {
        type: "string",
        alias: "b",
        default: "master",
        description: "branch to compare PO file with"
      }
    },
    extractDiff
  )
  .env()
  .help().argv;
