#!/usr/bin/env node

const path = require('path');

const {
    addLineBeforeClosingBrace,
    assertFileInsertable,
    ensureDomainExists,
    ensureFileExists,
    ensureFileNotExists,
    escapeSingleQuote,
    insertObjectBlockBeforePattern,
    readTemplate,
    renderTemplate,
    repoPath,
    toLowerCamel,
    writeNewFile,
} = require('./backend-scaffold-utils.js');

function printUsage() {
    console.log('사용법: npm run create:backend-socket -- <domain> <SocketNameMessage|SocketNameEvent> [--auth] [--param-null] [--response-null] [--description "설명"]');
    console.log('또는:   npm run create:backend-socket -- <domain>/<SocketNameMessage|SocketNameEvent> [options]');
}

function parseArgs(argv) {
    const options = {
        authRequire: false,
        paramSchemaNull: false,
        responseSchemaNull: false,
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

        if (arg === '--response-null' || arg === '--no-response') {
            options.responseSchemaNull = true;
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
    let socketName = positional[1];

    if (positional.length === 1 && positional[0].includes('/')) {
        const parts = positional[0].split('/');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new Error('단일 인자를 사용할 때는 <domain>/<SocketName> 형식이어야 합니다.');
        }

        [domainName, socketName] = parts;
    } else if (positional.length !== 2) {
        throw new Error('도메인 이름과 socket 이름이 필요합니다.');
    }

    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(domainName)) {
        throw new Error('도메인 이름은 영문자로 시작하고 영문자 또는 숫자만 포함할 수 있습니다.');
    }

    if (!/^[A-Z][A-Za-z0-9]*$/.test(socketName)) {
        throw new Error('socket 이름은 PascalCase 형식이어야 합니다.');
    }

    const isMessage = socketName.endsWith('Message');
    const isEvent = socketName.endsWith('Event');
    if (!isMessage && !isEvent) {
        throw new Error('socket 이름은 Message 또는 Event suffix로 끝나야 합니다.');
    }

    if (isEvent && options.authRequire) {
        throw new Error('Event 항목에는 --auth를 사용할 수 없습니다.');
    }

    if (isEvent && options.paramSchemaNull) {
        throw new Error('Event 항목에는 paramSchema가 없으므로 --param-null이 필요하지 않습니다.');
    }

    return {
        domainName,
        socketName,
        type: isMessage ? 'message' : 'event',
        authRequire: options.authRequire,
        paramSchemaNull: options.paramSchemaNull,
        responseSchemaNull: options.responseSchemaNull,
        description: options.description || `${socketName} 설명`,
    };
}

function main() {
    const {
        domainName,
        socketName,
        type,
        authRequire,
        paramSchemaNull,
        responseSchemaNull,
        description,
    } = parseArgs(process.argv.slice(2));

    const backendRoot = repoPath('backend');
    const domainRoot = path.join(backendRoot, domainName);
    const templateRoot = path.join(__dirname, 'templates', 'backend-socket');
    const socketsFilePath = path.join(domainRoot, '_sockets.sys.js');
    const paramsFilePath = path.join(domainRoot, '_param.sys.js');
    const responseFilePath = path.join(domainRoot, '_response.sys.js');
    const logicFileName = toLowerCamel(socketName);
    const logicFilePath = path.join(domainRoot, `${logicFileName}.js`);
    const responseClassName = type === 'message' ? `${socketName}OK` : socketName;
    const socketDuplicatePattern = new RegExp(`\\b${socketName}\\s*:`);
    const responseDuplicatePattern = new RegExp(`\\b${responseClassName}\\s*:`);

    ensureDomainExists(domainRoot);
    ensureFileExists(socketsFilePath);
    ensureFileExists(responseFilePath);
    if (type === 'message' && !paramSchemaNull) ensureFileExists(paramsFilePath);

    assertFileInsertable(socketsFilePath, [/\r?\n\}\s*$/], socketDuplicatePattern);
    if (type === 'message') ensureFileNotExists(logicFilePath);
    if (type === 'message' && !paramSchemaNull) {
        assertFileInsertable(paramsFilePath, [/\r?\n\}\s*$/], socketDuplicatePattern);
    }
    if (!responseSchemaNull) {
        assertFileInsertable(responseFilePath, [/\r?\n\}\s*$/], responseDuplicatePattern);
    }

    const responseSchemaLine = responseSchemaNull ? '' : `            responseSchema.${responseClassName},`;
    const socketBlock = renderTemplate(readTemplate(path.join(templateRoot, type === 'message' ? 'message.block.txt' : 'event.block.txt')), {
        domainName,
        socketName,
        logicFileName,
        authRequire: String(authRequire),
        description: escapeSingleQuote(description),
        paramSchema: paramSchemaNull ? 'null' : `paramSchema.${socketName}`,
        responseSchemaLine,
    });

    insertObjectBlockBeforePattern(
        socketsFilePath,
        socketBlock,
        [/\r?\n\}\s*$/],
        socketDuplicatePattern
    );

    if (type === 'message') {
        const successReturn = `return new response.${responseSchemaNull ? 'OK' : responseClassName}()`;
        const logicContent = renderTemplate(readTemplate(path.join(templateRoot, 'message.logic.js')), {
            successReturn,
        });
        writeNewFile(logicFilePath, logicContent);

        if (!paramSchemaNull) {
            const paramBlock = renderTemplate(readTemplate(path.join(templateRoot, 'param.block.txt')), {
                socketName,
            });
            insertObjectBlockBeforePattern(
                paramsFilePath,
                paramBlock,
                [/\r?\n\}\s*$/],
                socketDuplicatePattern
            );
        }
    }

    if (!responseSchemaNull) {
        const responseBlock = renderTemplate(readTemplate(path.join(templateRoot, type === 'message' ? 'message-response.block.txt' : 'event-response.block.txt')), {
            socketName,
            responseClassName,
            successMessage: `${socketName} 처리 성공`,
        });
        insertObjectBlockBeforePattern(
            responseFilePath,
            responseBlock,
            [/\r?\n\}\s*$/],
            responseDuplicatePattern
        );
    }

    addLineBeforeClosingBrace(path.join(backendRoot, '_param.sys.js'), `    ...require('./${domainName}/_param.sys.js'),`);
    addLineBeforeClosingBrace(path.join(backendRoot, '_response.sys.js'), `    ...require('./${domainName}/_response.sys.js'),`);
    addLineBeforeClosingBrace(path.join(backendRoot, '_sockets.sys.js'), `    ...require('./${domainName}/_sockets.sys.js'),`);

    console.log('');
    console.log(`[완료] socket ${type} 스캐폴드 생성: ${domainName}.${socketName}`);
    console.log('');
    console.log('다음 단계:');
    [
        type === 'message' ? `${logicFilePath}에 message 처리 로직을 구현한다.` : null,
        type === 'message' && !paramSchemaNull ? `${paramsFilePath}의 ${socketName} param schema를 채운다.` : null,
        !responseSchemaNull ? `${responseFilePath}의 ${responseClassName} 응답 문서를 실제 payload에 맞춘다.` : null,
        '/API-doc/sockets 반영 여부를 확인한다.',
    ].filter(Boolean).forEach((step, index) => console.log(`${index + 1}. ${step}`));
}

try {
    main();
} catch (error) {
    console.error(`[오류] ${error.message}`);
    printUsage();
    process.exit(1);
}
