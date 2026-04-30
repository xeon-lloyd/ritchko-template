#!/usr/bin/env node

const path = require('path');

const {
    addLineBeforeClosingBrace,
    assertFileInsertable,
    ensureDomainExists,
    ensureFileExists,
    ensureFileNotExists,
    ensureSuffix,
    escapeSingleQuote,
    insertObjectBlockBeforePattern,
    readTemplate,
    renderTemplate,
    repoPath,
    toPascalCase,
    writeNewFile,
} = require('./backend-scaffold-utils.js');

function printUsage() {
    console.log('사용법: npm run create:backend-webhook -- <domain> <webhookNameWithoutProcess> [--method post|get|put|patch|delete] [--param-null] [--response-null] [--redirect] [--description "설명"]');
    console.log('또는:   npm run create:backend-webhook -- <domain>/<webhookNameWithoutProcess> [options]');
    console.log('예:     npm run create:backend-webhook -- user appleSocialLogin');
    console.log('        endpoint는 /webhook/user/appleSocialLogin, 로직 파일은 appleSocialLoginProcess.js로 생성됩니다.');
}

function parseArgs(argv) {
    const options = {
        method: 'post',
        paramSchemaNull: false,
        responseSchemaNull: false,
        redirect: false,
        description: null,
    };
    const positional = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '--method') {
            const method = argv[i + 1];
            if (!method || method.startsWith('--')) {
                throw new Error('--method 다음에 HTTP method가 필요합니다.');
            }

            options.method = method.toLowerCase();
            i += 1;
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

        if (arg === '--redirect') {
            options.redirect = true;
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
    let webhookName = positional[1];

    if (positional.length === 1 && positional[0].includes('/')) {
        const parts = positional[0].split('/');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new Error('단일 인자를 사용할 때는 <domain>/<webhookNameWithoutProcess> 형식이어야 합니다.');
        }

        [domainName, webhookName] = parts;
    } else if (positional.length !== 2) {
        throw new Error('도메인 이름과 webhook 이름이 필요합니다.');
    }

    if (!/^[a-z][A-Za-z0-9]*$/.test(domainName)) {
        throw new Error('도메인 이름은 lowerCamelCase 형식이어야 합니다.');
    }

    if (!/^[a-z][A-Za-z0-9]*$/.test(webhookName)) {
        throw new Error('webhook 이름은 lowerCamelCase 형식이어야 합니다.');
    }

    if (webhookName.endsWith('Process')) {
        throw new Error('webhook 이름에는 Process suffix를 붙이지 않습니다. 로직 파일명에 자동으로 붙습니다.');
    }

    if (!['get', 'post', 'put', 'patch', 'delete'].includes(options.method)) {
        throw new Error(`지원하지 않는 HTTP method입니다: ${options.method}`);
    }

    return {
        domainName,
        webhookName,
        method: options.method,
        paramSchemaNull: options.paramSchemaNull,
        responseSchemaNull: options.responseSchemaNull,
        redirect: options.redirect,
        description: options.description || `${webhookName} 설명`,
    };
}

function main() {
    const {
        domainName,
        webhookName,
        method,
        paramSchemaNull,
        responseSchemaNull,
        redirect,
        description,
    } = parseArgs(process.argv.slice(2));

    const backendRoot = repoPath('backend');
    const domainRoot = path.join(backendRoot, domainName);
    const templateRoot = path.join(__dirname, 'templates', 'backend-webhook');
    const webhooksFilePath = path.join(domainRoot, '_webhooks.sys.js');
    const paramsFilePath = path.join(domainRoot, '_param.sys.js');
    const responseFilePath = path.join(domainRoot, '_response.sys.js');
    const logicFileName = `${webhookName}Process`;
    const logicFilePath = path.join(domainRoot, `${logicFileName}.js`);
    const registryKey = `/${domainName}/${webhookName}`;
    const responseClassName = `${ensureSuffix(toPascalCase(webhookName), 'Process')}OK`;

    ensureDomainExists(domainRoot);
    ensureFileExists(webhooksFilePath);
    ensureFileExists(responseFilePath);
    if (!paramSchemaNull) ensureFileExists(paramsFilePath);

    const responseSchemaLine = responseSchemaNull ? '' : `            responseSchema.${responseClassName},`;
    const webhookDuplicatePattern = new RegExp(`['"]${registryKey.replace(/\//g, '\\/')}['"]\\s*:`);
    const responseDuplicatePattern = new RegExp(`\\b${responseClassName}\\s*:`);

    ensureFileNotExists(logicFilePath);
    assertFileInsertable(webhooksFilePath, [/\r?\n\}\s*$/], webhookDuplicatePattern);
    if (!paramSchemaNull) {
        assertFileInsertable(
            paramsFilePath,
            [
                /\r?\n\s*\/\*\s*\/\/\s*sockets\b.*$/m,
                /\r?\n\}\s*$/,
            ],
            webhookDuplicatePattern
        );
    }
    if (!responseSchemaNull) {
        assertFileInsertable(
            responseFilePath,
            [
                /\r?\n\s*\/\*\s*\/\/\s*sockets\b.*$/m,
                /\r?\n\}\s*$/,
            ],
            responseDuplicatePattern
        );
    }

    const webhookBlock = renderTemplate(readTemplate(path.join(templateRoot, 'webhook.block.txt')), {
        domainName,
        webhookName,
        logicFileName,
        method,
        description: escapeSingleQuote(description),
        paramSchema: paramSchemaNull ? 'null' : `paramSchema['${registryKey}']`,
        responseSchemaLine,
    });

    const successStatement = redirect
        ? "return res.redirect('/')"
        : `return res.status(200).send(new response.${responseSchemaNull ? 'OK' : responseClassName}())`;
    const logicContent = renderTemplate(readTemplate(path.join(templateRoot, 'logic.js')), {
        successStatement,
    });

    insertObjectBlockBeforePattern(
        webhooksFilePath,
        webhookBlock,
        [/\r?\n\}\s*$/],
        webhookDuplicatePattern
    );

    if (!paramSchemaNull) {
        const paramBlock = renderTemplate(readTemplate(path.join(templateRoot, 'param.block.txt')), {
            domainName,
            webhookName,
        });
        insertObjectBlockBeforePattern(
            paramsFilePath,
            paramBlock,
            [
                /\r?\n\s*\/\*\s*\/\/\s*sockets\b.*$/m,
                /\r?\n\}\s*$/,
            ],
            webhookDuplicatePattern
        );
    }

    if (!responseSchemaNull) {
        const responseTemplate = redirect ? 'response-redirect.block.txt' : 'response-ok.block.txt';
        const responseBlock = renderTemplate(readTemplate(path.join(templateRoot, responseTemplate)), {
            responseGroupName: ensureSuffix(toPascalCase(webhookName), 'Process'),
            responseClassName,
            successMessage: `${webhookName} 처리 성공`,
        });
        insertObjectBlockBeforePattern(
            responseFilePath,
            responseBlock,
            [
                /\r?\n\s*\/\*\s*\/\/\s*sockets\b.*$/m,
                /\r?\n\}\s*$/,
            ],
            responseDuplicatePattern
        );
    }

    writeNewFile(logicFilePath, logicContent);

    addLineBeforeClosingBrace(path.join(backendRoot, '_param.sys.js'), `    ...require('./${domainName}/_param.sys.js'),`);
    addLineBeforeClosingBrace(path.join(backendRoot, '_response.sys.js'), `    ...require('./${domainName}/_response.sys.js'),`);
    addLineBeforeClosingBrace(path.join(backendRoot, '_webhooks.sys.js'), `    ...require('./${domainName}/_webhooks.sys.js'),`);

    console.log('');
    console.log(`[완료] webhook 스캐폴드 생성: ${registryKey}`);
    console.log('');
    console.log('다음 단계:');
    [
        `${logicFilePath}에 callback 처리 로직을 구현한다.`,
        !paramSchemaNull ? `${paramsFilePath}의 ${registryKey} param schema를 채운다.` : null,
        !responseSchemaNull ? `${responseFilePath}의 ${responseClassName} 응답 문서를 실제 응답에 맞춘다.` : null,
        '/API-doc/webhooks 반영 여부를 확인한다.',
    ].filter(Boolean).forEach((step, index) => console.log(`${index + 1}. ${step}`));
}

try {
    main();
} catch (error) {
    console.error(`[오류] ${error.message}`);
    printUsage();
    process.exit(1);
}
