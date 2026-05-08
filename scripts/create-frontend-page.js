#!/usr/bin/env node

const path = require('path');

const {
    ensureDir,
    ensureFileNotExists,
    readTemplate,
    renderTemplate,
    repoPath,
    writeNewFile,
} = require('./backend-scaffold-utils.js');

function printUsage() {
    console.log('사용법: npm run create:frontend-page -- <path> [--title "페이지 제목"]');
    console.log('       <path>는 확장자를 제외한 views 기준 경로입니다.');
    console.log('예:     npm run create:frontend-page -- user/signIn --title "로그인"');
}

function parseArgs(argv) {
    const options = {
        title: null,
    };
    const positional = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '--title') {
            const title = argv[i + 1];
            if (!title || title.startsWith('--')) {
                throw new Error('--title 다음에 페이지 제목이 필요합니다.');
            }

            options.title = title;
            i += 1;
            continue;
        }

        if (arg.startsWith('--')) {
            throw new Error(`알 수 없는 옵션입니다: ${arg}`);
        }

        positional.push(arg);
    }

    if (positional.length !== 1) {
        throw new Error('페이지 경로가 필요합니다.');
    }

    const pagePath = normalizePagePath(positional[0]);
    const segments = pagePath.split('/');
    const pageName = segments[segments.length - 1];

    return {
        pagePath,
        title: options.title || pageName,
    };
}

function normalizePagePath(inputPath) {
    const pagePath = inputPath.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

    if (!pagePath) {
        throw new Error('페이지 경로가 필요합니다.');
    }

    if (pagePath.includes('//')) {
        throw new Error('페이지 경로에 빈 segment를 사용할 수 없습니다.');
    }

    const segments = pagePath.split('/');

    for (const segment of segments) {
        if (segment === '.' || segment === '..') {
            throw new Error('페이지 경로에 . 또는 .. segment를 사용할 수 없습니다.');
        }

        if (!/^[a-z][A-Za-z0-9]*$/.test(segment)) {
            throw new Error('페이지 경로 segment는 lowerCamelCase 형식이어야 합니다.');
        }
    }

    return segments.join('/');
}

function getIncludeBase(pagePath) {
    const depth = pagePath.split('/').length - 1;
    if (depth === 0) return './temp';

    return `${'../'.repeat(depth)}temp`;
}

function toPageObjectName(pagePath) {
    const segments = pagePath.split('/');
    return segments[segments.length - 1];
}

function main() {
    const { pagePath, title } = parseArgs(process.argv.slice(2));

    const templateRoot = path.join(__dirname, 'templates', 'frontend-page');
    const htmlPath = repoPath('views', `${pagePath}.html`);
    const scssPath = repoPath('public', 'scss', `${pagePath}.scss`);
    const jsPath = repoPath('public', 'js', `${pagePath}.js`);

    ensureFileNotExists(htmlPath);
    ensureFileNotExists(scssPath);
    ensureFileNotExists(jsPath);

    const values = {
        documentTitle: `${title} - 프로젝트`,
        includeBase: getIncludeBase(pagePath),
        pageClass: toPageObjectName(pagePath),
        pageObjectName: toPageObjectName(pagePath),
        scriptSrc: `/js/${pagePath}.js`,
        styleHref: `/css/${pagePath}.css`,
        title,
    };

    const htmlContent = renderTemplate(readTemplate(path.join(templateRoot, 'page.html')), values);
    const scssContent = renderTemplate(readTemplate(path.join(templateRoot, 'page.scss')), values);
    const jsContent = renderTemplate(readTemplate(path.join(templateRoot, 'page.js')), values);

    ensureDir(path.dirname(htmlPath));
    ensureDir(path.dirname(scssPath));
    ensureDir(path.dirname(jsPath));

    writeNewFile(htmlPath, htmlContent);
    writeNewFile(scssPath, scssContent);
    writeNewFile(jsPath, jsContent);

    console.log('');
    console.log(`[완료] frontend page 스캐폴드 생성: /${pagePath}`);
    console.log('');
    console.log('다음 단계:');
    [
        `${htmlPath}에 페이지 마크업을 구현한다.`,
        `${scssPath}에 페이지 전용 스타일을 구현한다.`,
        `${jsPath}에 페이지 전용 동작을 구현한다.`,
        'npm run build로 SCSS 빌드 결과를 확인한다.',
    ].forEach((step, index) => console.log(`${index + 1}. ${step}`));
}

try {
    main();
} catch (error) {
    console.error(`[오류] ${error.message}`);
    printUsage();
    process.exit(1);
}
