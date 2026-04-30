const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }
}

function ensureFileNotExists(filePath) {
    if (fs.existsSync(filePath)) {
        throw new Error(`이미 파일이 존재합니다: ${filePath}`);
    }
}

function ensureDomainExists(domainRoot) {
    if (!fs.existsSync(domainRoot)) {
        throw new Error(`도메인을 찾을 수 없습니다: ${domainRoot}`);
    }
}

function readTemplate(templatePath) {
    ensureFileExists(templatePath);
    return fs.readFileSync(templatePath, 'utf8');
}

function detectEol(content) {
    return content.includes('\r\n') ? '\r\n' : '\n';
}

function escapeSingleQuote(value) {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderTemplate(template, values) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        if (!(key in values)) {
            throw new Error(`템플릿 변수 값을 찾을 수 없습니다: ${key}`);
        }

        return values[key];
    });
}

function lowerFirst(value) {
    return value.replace(/^[A-Z]/, letter => letter.toLowerCase());
}

function toLowerCamel(value) {
    const loweredAcronym = value.replace(/^[A-Z]+(?=[A-Z][a-z]|[0-9]|$)/, match => match.toLowerCase());
    return lowerFirst(loweredAcronym);
}

function toPascalCase(value) {
    return value
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map(part => part.replace(/^[a-z]/, letter => letter.toUpperCase()))
        .join('');
}

function ensureSuffix(value, suffix) {
    return value.endsWith(suffix) ? value : `${value}${suffix}`;
}

function findInsertionMatch(content, patterns) {
    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match.index !== undefined) {
            return match;
        }
    }

    return null;
}

function normalizeObjectPrefix(prefix) {
    const trimmedPrefix = prefix.replace(/\s*$/, '');
    const lastChar = trimmedPrefix.slice(-1);

    if (!lastChar || lastChar === '{' || lastChar === ',' || lastChar === '/') {
        return trimmedPrefix;
    }

    return `${trimmedPrefix},`;
}

function assertInsertable(content, filePath, patterns, duplicatePattern) {
    if (duplicatePattern && duplicatePattern.test(content)) {
        throw new Error(`이미 같은 이름이 존재합니다: ${filePath}`);
    }

    const match = findInsertionMatch(content, patterns);
    if (!match) {
        throw new Error(`삽입 위치를 찾지 못했습니다: ${filePath}`);
    }

    return match;
}

function assertFileInsertable(filePath, patterns, duplicatePattern) {
    assertInsertable(fs.readFileSync(filePath, 'utf8'), filePath, patterns, duplicatePattern);
}

function insertObjectBlockBeforePattern(filePath, block, patterns, duplicatePattern, spacing = {}) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = assertInsertable(content, filePath, patterns, duplicatePattern);
    const eol = detectEol(content);
    const beforeGap = spacing.beforeGap ?? 2;
    const afterGap = spacing.afterGap ?? 2;
    const normalizedBlock = block.trimEnd().replace(/\r?\n/g, eol);

    const prefix = normalizeObjectPrefix(content.slice(0, match.index));
    const suffix = content.slice(match.index).replace(/^(?:\s*\r?\n)+/, '');
    const updated = `${prefix}${eol.repeat(beforeGap)}${normalizedBlock}${eol.repeat(afterGap)}${suffix}`;
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`[수정] ${filePath}`);
}

function insertObjectBlockBeforeClosingBrace(filePath, block, duplicatePattern) {
    insertObjectBlockBeforePattern(filePath, block, [/\r?\n\}\s*$/], duplicatePattern, {
        beforeGap: 2,
        afterGap: 1,
    });
}

function insertRawBeforePattern(filePath, block, patterns, duplicatePattern, spacing = {}) {
    const content = fs.readFileSync(filePath, 'utf8');

    if (duplicatePattern && duplicatePattern.test(content)) {
        console.log(`[건너뜀] 이미 반영됨: ${filePath}`);
        return false;
    }

    const match = findInsertionMatch(content, patterns);
    if (!match) {
        throw new Error(`삽입 위치를 찾지 못했습니다: ${filePath}`);
    }

    const eol = detectEol(content);
    const beforeGap = spacing.beforeGap ?? 1;
    const afterGap = spacing.afterGap ?? 1;
    const normalizedBlock = block.trimEnd().replace(/\r?\n/g, eol);
    const prefix = content.slice(0, match.index).replace(/\s*$/, '');
    const suffix = content.slice(match.index).replace(/^(?:\s*\r?\n)+/, '');
    const updated = `${prefix}${eol.repeat(beforeGap)}${normalizedBlock}${eol.repeat(afterGap)}${suffix}`;
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`[수정] ${filePath}`);
    return true;
}

function addLineBeforeClosingBrace(filePath, line) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(line)) {
        console.log(`[건너뜀] 이미 반영됨: ${filePath}`);
        return;
    }

    const eol = detectEol(content);
    const updated = content.replace(/\r?\n\}(\s*)$/, `${eol}${line}${eol}}$1`);
    if (updated === content) {
        throw new Error(`닫는 중괄호 위치를 찾지 못했습니다: ${filePath}`);
    }

    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`[수정] ${filePath}`);
}

function writeNewFile(filePath, content) {
    ensureFileNotExists(filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[생성] ${filePath}`);
}

function repoPath(...parts) {
    return path.resolve(__dirname, '..', ...parts);
}

module.exports = {
    addLineBeforeClosingBrace,
    assertFileInsertable,
    ensureDir,
    ensureDomainExists,
    ensureFileExists,
    ensureFileNotExists,
    ensureSuffix,
    escapeSingleQuote,
    insertObjectBlockBeforeClosingBrace,
    insertObjectBlockBeforePattern,
    insertRawBeforePattern,
    readTemplate,
    renderTemplate,
    repoPath,
    toLowerCamel,
    toPascalCase,
    writeNewFile,
};
