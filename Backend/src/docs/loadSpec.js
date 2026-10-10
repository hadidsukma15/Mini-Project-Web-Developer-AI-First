'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SPEC_PATH = path.join(__dirname, '..', '..', 'docs', 'openapi.yaml');

const yamlText = fs.readFileSync(SPEC_PATH, 'utf8');
const spec = yaml.load(yamlText);

module.exports = { spec, yamlText, SPEC_PATH };
