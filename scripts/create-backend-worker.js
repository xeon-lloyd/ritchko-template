#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {
    addLineBeforeClosingBrace,
    assertFileInsertable,
    ensureDir,
    ensureDomainExists,
    ensureFileNotExists,
    insertRawBeforePattern,
    readTemplate,
    renderTemplate,
    repoPath,
    writeNewFile,
} = require('./backend-scaffold-utils.js');

function printUsage() {
    console.log('사용법: npm run create:backend-worker -- <domain> <workerName> [--cron "0 * * * *"] [--comment "1시간마다 실행"] [--ttl 600] [--no-lock] [--consumer]');
    console.log('또는:   npm run create:backend-worker -- <domain>/<workerName> [options]');
    console.log('기본 worker는 producer guard를 포함하고 consumer 없음으로 생성합니다. consumer가 필요하면 --consumer를 사용합니다.');
}

function parseArgs(argv) {
    const options = {
        cronExpression: null,
        cronComment: null,
        ttlSeconds: 10 * 60,
        useLock: true,
        hasConsumer: false,
    };
    const positional = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '--cron') {
            const cronExpression = argv[i + 1];
            if (!cronExpression || cronExpression.startsWith('--')) {
                throw new Error('--cron 다음에 cron expression이 필요합니다.');
            }

            options.cronExpression = cronExpression;
            i += 1;
            continue;
        }

        if (arg === '--comment') {
            const cronComment = argv[i + 1];
            if (!cronComment || cronComment.startsWith('--')) {
                throw new Error('--comment 다음에 주석 문자열이 필요합니다.');
            }

            options.cronComment = cronComment;
            i += 1;
            continue;
        }

        if (arg === '--ttl') {
            const ttlSeconds = Number(argv[i + 1]);
            if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
                throw new Error('--ttl 다음에 양의 정수 초 단위 값이 필요합니다.');
            }

            options.ttlSeconds = ttlSeconds;
            i += 1;
            continue;
        }

        if (arg === '--no-lock') {
            options.useLock = false;
            continue;
        }

        if (arg === '--consumer') {
            options.hasConsumer = true;
            continue;
        }

        if (arg.startsWith('--')) {
            throw new Error(`알 수 없는 옵션입니다: ${arg}`);
        }

        positional.push(arg);
    }

    let domainName = positional[0];
    let workerName = positional[1];

    if (positional.length === 1 && positional[0].includes('/')) {
        const parts = positional[0].split('/');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new Error('단일 인자를 사용할 때는 <domain>/<workerName> 형식이어야 합니다.');
        }

        [domainName, workerName] = parts;
    } else if (positional.length !== 2) {
        throw new Error('도메인 이름과 worker 이름이 필요합니다.');
    }

    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(domainName)) {
        throw new Error('도메인 이름은 영문자로 시작하고 영문자 또는 숫자만 포함할 수 있습니다.');
    }

    if (!/^[a-z][A-Za-z0-9]*$/.test(workerName)) {
        throw new Error('worker 이름은 lowerCamelCase 형식이어야 합니다.');
    }

    return {
        domainName,
        workerName,
        cronExpression: options.cronExpression,
        cronComment: options.cronComment || `${options.cronExpression || '0 * * * *'} 실행`,
        ttlSeconds: options.ttlSeconds,
        useLock: options.useLock,
        hasConsumer: options.hasConsumer,
    };
}

function ensureDomainCronFile(workerRoot, templateRoot) {
    const cronFilePath = path.join(workerRoot, 'registCron.js');
    if (fs.existsSync(cronFilePath)) return cronFilePath;

    ensureDir(workerRoot);
    fs.writeFileSync(cronFilePath, readTemplate(path.join(templateRoot, 'registCron.js')), 'utf8');
    console.log(`[생성] ${cronFilePath}`);
    return cronFilePath;
}

function getConsumerBlock(hasConsumer) {
    if (!hasConsumer) return '// consumer 없음';

    return [
        'util.redis.consume(queueName, async (data) => {',
        '    // 핵심 비즈니스 처리',
        '})',
    ].join('\n');
}

function main() {
    const {
        domainName,
        workerName,
        cronExpression,
        cronComment,
        ttlSeconds,
        useLock,
        hasConsumer,
    } = parseArgs(process.argv.slice(2));

    const backendRoot = repoPath('backend');
    const domainRoot = path.join(backendRoot, domainName);
    const workerRoot = path.join(domainRoot, 'worker');
    const templateRoot = path.join(__dirname, 'templates', 'backend-worker');
    ensureDomainExists(domainRoot);

    const cronFilePath = ensureDomainCronFile(workerRoot, templateRoot);
    const workerFilePath = path.join(workerRoot, `${workerName}.js`);

    ensureFileNotExists(workerFilePath);
    assertFileInsertable(
        cronFilePath,
        [/\r?\nmodule\.exports\s*=\s*(?:async\s+)?function\s*\(/],
        new RegExp(`require\\(['"]\\.\\/${workerName}\\.js['"]\\)`)
    );
    assertFileInsertable(
        cronFilePath,
        [/\r?\n\}\s*$/],
        new RegExp(`\\b${workerName}\\s*\\(`)
    );

    const workerTemplate = useLock ? 'worker-lock.js' : 'worker-no-lock.js';
    const workerContent = renderTemplate(readTemplate(path.join(templateRoot, workerTemplate)), {
        workerName,
        ttlSeconds: String(ttlSeconds),
        utilRequire: hasConsumer ? "const util = require('../../core/util.js');\n\n" : '',
        consumerBlock: getConsumerBlock(hasConsumer),
    });
    writeNewFile(workerFilePath, workerContent);

    insertRawBeforePattern(
        cronFilePath,
        `const ${workerName} = require('./${workerName}.js');`,
        [/\r?\nmodule\.exports\s*=\s*(?:async\s+)?function\s*\(/],
        new RegExp(`require\\(['"]\\.\\/${workerName}\\.js['"]\\)`),
        {
            beforeGap: 1,
            afterGap: 2,
        }
    );

    const cronTemplate = cronExpression ? 'cron-active.block.txt' : 'cron-commented.block.txt';
    const cronBlock = renderTemplate(readTemplate(path.join(templateRoot, cronTemplate)), {
        workerName,
        cronExpression: cronExpression || '0 * * * *',
        cronComment,
    });
    insertRawBeforePattern(
        cronFilePath,
        cronBlock,
        [/\r?\n\}\s*$/],
        new RegExp(`\\b${workerName}\\s*\\(`),
        {
            beforeGap: 2,
            afterGap: 1,
        }
    );

    addLineBeforeClosingBrace(path.join(backendRoot, 'worker', 'registCron.js'), `    require('../${domainName}/worker/registCron.js')()`);

    console.log('');
    console.log(`[완료] worker 스캐폴드 생성: ${domainName}.${workerName}`);
    console.log('');
    console.log('다음 단계:');
    [
        `${workerFilePath}에 background 작업 로직을 구현한다.`,
        `${workerFilePath}의 queueName은 'WP:${workerName}' 형식을 유지한다.`,
        hasConsumer ? `${workerFilePath}의 // consumer 영역에 queue 처리 로직을 구현한다.` : `${workerFilePath}는 consumer 없음으로 생성됐다.`,
        !cronExpression ? `${cronFilePath}의 cron.schedule 주석을 실제 실행 주기에 맞춰 해제한다.` : null,
        'root/도메인 registCron.js 집계와 producer guard 필요 여부를 확인한다.',
    ].filter(Boolean).forEach((step, index) => console.log(`${index + 1}. ${step}`));
}

try {
    main();
} catch (error) {
    console.error(`[오류] ${error.message}`);
    printUsage();
    process.exit(1);
}
