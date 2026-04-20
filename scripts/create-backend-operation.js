#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function printUsage() {
    console.log('사용법: npm run create:backend-operation -- <domain> <OperationName> [--auth] [--param-null] [--description "설명"]');
    console.log('또는:   npm run create:backend-operation -- <domain>/<OperationName> [--auth] [--param-null] [--description "설명"]');
}

function parseArgs(argv) {
    const options = {
        authRequire: false,
        paramSchemaNull: false,
        description: null,
    };
    const positional = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '--auth') {
            options.authRequire = true;
            continue;
        }

        if (arg === '--param-null' || arg === '--no-param') {
            options.paramSchemaNull = true;
            continue;
        }

        if (arg === '--description') {
            const description = argv[i + 1];
            if (!description || description.startsWith('--')) {
                throw new Error('--description 다음에 설명 문자열이 필요합니다.');
            }

            options.description = description;
            i += 1;
            continue;
        }

        if (arg.startsWith('--')) {
            throw new Error(`알 수 없는 옵션입니다: ${arg}`);
        }

        positional.push(arg);
    }

    let domainName = positional[0];
    let operationName = positional[1];

    if (positional.length === 1 && positional[0].includes('/')) {
        const parts = positional[0].split('/');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new Error('단일 인자를 사용할 때는 <domain>/<OperationName> 형식이어야 합니다.');
        }

        [domainName, operationName] = parts;
    } else if (positional.length !== 2) {
        throw new Error('도메인 이름과 Operation 이름이 필요합니다.');
    }

    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(domainName)) {
        throw new Error('도메인 이름은 영문자로 시작하고 영문자 또는 숫자만 포함할 수 있습니다.');
    }

    if (!/^[A-Z][A-Za-z0-9]*$/.test(operationName)) {
        throw new Error('Operation 이름은 대문자로 시작하는 PascalCase 형식이어야 합니다.');
    }

    return {
        domainName,
        operationName,
        authRequire: options.authRequire,
        paramSchemaNull: options.paramSchemaNull,
        description: options.description || `${operationName} 설명`,
    };
}

function ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }
}

function ensureDomainExists(domainRoot) {
    if (!fs.existsSync(domainRoot)) {
        throw new Error(`도메인을 찾을 수 없습니다: ${domainRoot}`);
    }
}

function readTemplate(templatePath) {
    if (!fs.existsSync(templatePath)) {
        throw new Error(`템플릿 파일을 찾을 수 없습니다: ${templatePath}`);
    }

    return fs.readFileSync(templatePath, 'utf8');
}

function toLogicFileName(operationName) {
    const loweredAcronym = operationName.replace(/^[A-Z]+(?=[A-Z][a-z]|[0-9]|$)/, match => match.toLowerCase());
    return loweredAcronym.replace(/^[A-Z]/, letter => letter.toLowerCase());
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

function normalizePrefixForObjectEntry(prefix) {
    const trimmedPrefix = prefix.replace(/\s*$/, '');
    const lastChar = trimmedPrefix.slice(-1);

    if (!lastChar || lastChar === '{' || lastChar === ',') {
        return trimmedPrefix;
    }

    return `${trimmedPrefix},`;
}

function detectEol(content) {
    return content.includes('\r\n') ? '\r\n' : '\n';
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

function assertInsertable(content, filePath, patterns, duplicatePattern) {
    if (duplicatePattern.test(content)) {
        throw new Error(`이미 같은 이름이 존재합니다: ${filePath}`);
    }

    const match = findInsertionMatch(content, patterns);
    if (!match) {
        throw new Error(`삽입 위치를 찾지 못했습니다: ${filePath}`);
    }

    return match;
}

function insertBeforePattern(filePath, block, patterns, duplicatePattern, spacing = {}) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = assertInsertable(content, filePath, patterns, duplicatePattern);
    const eol = detectEol(content);
    const beforeGap = spacing.beforeGap ?? 2;
    const afterGap = spacing.afterGap ?? 2;

    const prefix = normalizePrefixForObjectEntry(content.slice(0, match.index));
    const suffix = content.slice(match.index).replace(/^(?:\s*\r?\n)+/, '');
    const updated = `${prefix}${eol.repeat(beforeGap)}${block.trimEnd()}${eol.repeat(afterGap)}${suffix}`;
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`[수정] ${filePath}`);
}

function insertBeforeClosingBrace(filePath, block, duplicatePattern) {
    insertBeforePattern(filePath, block, [/\r?\n\}\s*$/], duplicatePattern, {
        beforeGap: 2,
        afterGap: 1,
    });
}

function insertBeforeCommentSection(filePath, block, duplicatePattern) {
    insertBeforePattern(
        filePath,
        block,
        [
            /\r?\n\s*\/\*\s*\/\/\s*webhooks\b.*$/m,
            /\r?\n\s*\/\*\s*\/\/\s*sockets\b.*$/m,
            /\r?\n\}\s*$/,
        ],
        duplicatePattern,
        {
            beforeGap: 2,
            afterGap: 2,
        }
    );
}

function validateInsertTargets(operationsFilePath, paramsFilePath, operationName, paramSchemaNull) {
    assertInsertable(
        fs.readFileSync(operationsFilePath, 'utf8'),
        operationsFilePath,
        [/\r?\n\}\s*$/],
        new RegExp(`\\b${operationName}\\s*:`)
    );

    if (!paramSchemaNull) {
        assertInsertable(
            fs.readFileSync(paramsFilePath, 'utf8'),
            paramsFilePath,
            [
                /\r?\n\s*\/\*\s*\/\/\s*webhooks\b.*$/m,
                /\r?\n\s*\/\*\s*\/\/\s*sockets\b.*$/m,
                /\r?\n\}\s*$/,
            ],
            new RegExp(`\\b${operationName}\\s*:`)
        );
    }

}

function main() {
    const { domainName, operationName, authRequire, paramSchemaNull, description } = parseArgs(process.argv.slice(2));

    const repoRoot = path.resolve(__dirname, '..');
    const domainRoot = path.join(repoRoot, 'backend', domainName);
    const templateRoot = path.join(__dirname, 'templates', 'backend-operation');
    const operationsFilePath = path.join(domainRoot, '_operations.sys.js');
    const paramsFilePath = path.join(domainRoot, '_param.sys.js');
    ensureDomainExists(domainRoot);
    ensureFileExists(operationsFilePath);
    ensureDomainExists(templateRoot);
    if (!paramSchemaNull) {
        ensureFileExists(paramsFilePath);
    }

    const logicFileName = toLogicFileName(operationName);
    const logicFilePath = path.join(domainRoot, `${logicFileName}.js`);
    const logicTemplatePath = path.join(templateRoot, 'logic.js');
    const operationTemplatePath = path.join(templateRoot, 'operation.block.txt');
    const paramTemplatePath = path.join(templateRoot, 'param.block.txt');

    if (fs.existsSync(logicFilePath)) {
        throw new Error(`이미 로직 파일이 존재합니다: ${logicFilePath}`);
    }

    validateInsertTargets(
        operationsFilePath,
        paramsFilePath,
        operationName,
        paramSchemaNull
    );

    const operationBlock = renderTemplate(readTemplate(operationTemplatePath), {
        domainName,
        operationName,
        logicFileName,
        authRequire: String(authRequire),
        paramSchema: paramSchemaNull ? 'null' : `paramSchema.${operationName}`,
        description: escapeSingleQuote(description),
    });

    fs.writeFileSync(logicFilePath, readTemplate(logicTemplatePath), 'utf8');
    console.log(`[생성] ${logicFilePath}`);

    insertBeforeClosingBrace(
        operationsFilePath,
        operationBlock,
        new RegExp(`\\b${operationName}\\s*:`)
    );

    if (!paramSchemaNull) {
        const paramBlock = renderTemplate(readTemplate(paramTemplatePath), {
            operationName,
        });
        insertBeforeCommentSection(
            paramsFilePath,
            paramBlock,
            new RegExp(`\\b${operationName}\\s*:`)
        );
    }

    console.log('');
    console.log(`[완료] operation 스캐폴드 생성: ${domainName}.${operationName}`);
    console.log('');
    console.log('다음 단계:');
    console.log(`1. ${logicFilePath}에 입력값 검증과 비즈니스 로직을 구현한다.`);
    if (paramSchemaNull) {
        console.log(`2. ${operationsFilePath}는 paramSchema: null로 생성됐다.`);
        console.log('3. 필요하면 _operations.sys.js의 responseSchema를 구체 응답 클래스로 보강한다.');
        console.log('4. /API-doc 반영 여부를 확인한다.');
    } else {
        console.log(`2. ${paramsFilePath}의 ${operationName} param schema를 채운다.`);
        console.log('3. 필요하면 _operations.sys.js의 responseSchema를 구체 응답 클래스로 보강한다.');
        console.log('4. /API-doc 반영 여부를 확인한다.');
    }
}

try {
    main();
} catch (error) {
    console.error(`[오류] ${error.message}`);
    printUsage();
    process.exit(1);
}
