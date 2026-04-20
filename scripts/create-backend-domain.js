#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function printUsage() {
    console.log('사용법: npm run create:backend-domain -- <DomainName>');
}

function parseArgs(argv) {
    const domainName = argv[0];

    if (!domainName) {
        throw new Error('도메인 이름이 필요합니다.');
    }

    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(domainName)) {
        throw new Error('도메인 이름은 영문자로 시작하고 영문자 또는 숫자만 포함할 수 있습니다.');
    }

    if (argv.length > 1) {
        throw new Error(`알 수 없는 인자입니다: ${argv[1]}`);
    }

    return domainName;
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function copyDirectory(sourceDir, targetDir) {
    ensureDir(targetDir);

    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(sourcePath, targetPath);
            continue;
        }

        fs.copyFileSync(sourcePath, targetPath);
        console.log(`[생성] ${targetPath}`);
    }
}

function addLineBeforeClosingBrace(filePath, line) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(line)) {
        console.log(`[건너뜀] 이미 반영됨: ${filePath}`);
        return;
    }

    const updated = content.replace(/\r?\n\}$/, `\n${line}\n}`);
    if (updated === content) {
        throw new Error(`닫는 중괄호 위치를 찾지 못했습니다: ${filePath}`);
    }

    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`[수정] ${filePath}`);
}

function main() {
    const domainName = parseArgs(process.argv.slice(2));

    const repoRoot = path.resolve(__dirname, '..');
    const backendRoot = path.join(repoRoot, 'backend');
    const domainRoot = path.join(backendRoot, domainName);
    const templateRoot = path.join(__dirname, 'templates', 'backend-domain');

    if (!fs.existsSync(templateRoot)) {
        throw new Error(`템플릿 디렉터리를 찾을 수 없습니다: ${templateRoot}`);
    }

    if (fs.existsSync(domainRoot)) {
        throw new Error(`이미 존재하는 도메인입니다: ${domainRoot}`);
    }

    ensureDir(domainRoot);
    ensureDir(path.join(domainRoot, 'module'));

    copyDirectory(templateRoot, domainRoot);

    console.log(`[완료] 도메인 스캐폴드 생성: ${domainRoot}`);

    addLineBeforeClosingBrace(path.join(backendRoot, '_operations.sys.js'), `    ...require('./${domainName}/_operations.sys.js'),`);
    addLineBeforeClosingBrace(path.join(backendRoot, '_param.sys.js'), `    ...require('./${domainName}/_param.sys.js'),`);
    addLineBeforeClosingBrace(path.join(backendRoot, '_response.sys.js'), `    ...require('./${domainName}/_response.sys.js'),`);
    addLineBeforeClosingBrace(path.join(backendRoot, '_webhooks.sys.js'), `    ...require('./${domainName}/_webhooks.sys.js'),`);
    addLineBeforeClosingBrace(path.join(backendRoot, '_sockets.sys.js'), `    ...require('./${domainName}/_sockets.sys.js'),`);
    addLineBeforeClosingBrace(path.join(backendRoot, 'worker', 'registCron.js'), `    require('../${domainName}/worker/registCron.js')()`);

    console.log('');
    console.log('다음 단계:');
    console.log(`1. ${path.join(domainRoot, '_operations.sys.js')} 내용을 채운다.`);
    console.log(`2. ${path.join(domainRoot, '_param.sys.js')} 내용을 채운다.`);
    console.log(`3. ${path.join(domainRoot, '_response.sys.js')} 내용을 채운다.`);
    console.log('4. backend/AGENTS.md를 확인한다.');
    console.log('5. operation 추가 후 /API-doc를 확인한다.');
}

try {
    main();
} catch (error) {
    console.error(`[오류] ${error.message}`);
    printUsage();
    process.exit(1);
}
