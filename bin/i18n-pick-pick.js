#!/usr/bin/env node
// vim: set ft=javascript:

const fs = require('fs');

const needImport = [];

function replace(text, chinese, replaceString) {
    let textArr = text.split(/intl\.get\(.+?\)/);
    const newArr = JSON.parse(JSON.stringify(textArr));
    textArr.forEach((item, index, arr) => {
        arr[index] = item.replace(chinese, replaceString);
    });
    newArr.forEach((item, index, arr) => {
        if (item !== textArr[index]) {
            text = text.replace(item, textArr[index]);
        }
    })
    return text;
}

function generateAndWrite(text, left, right) {
    if (!text) return;
    const detailArr = text.split('#');
    // 拿到文件数据
    const data = fs.readFileSync(detailArr[1], 'utf8');
    const arr = data.split('\n');

    const temp1 = arr[detailArr[2] - 1];
    const temp2 = arr[detailArr[2]];
    let chinese = detailArr[0].replace(/\\"/g, '"');
    const replaceString = `${left}intl.get('${chinese.replace(/'/g, '\\\'')}')${right}`;
    // 这里是为了匹配前后如果有引号的情况
    arr[detailArr[2] - 1] = replace(arr[detailArr[2] - 1], `"${chinese}"`, replaceString);
    if (temp1 === arr[detailArr[2] - 1]) {
        arr[detailArr[2] - 1] = replace(arr[detailArr[2] - 1], `'${chinese}'`, replaceString);
        if (temp1 === arr[detailArr[2] - 1]) {
            arr[detailArr[2] - 1] = replace(arr[detailArr[2] - 1], chinese, replaceString);
            if (temp1 === arr[detailArr[2] - 1]) {
                arr[detailArr[2]] = replace(arr[detailArr[2]], `"${chinese}"`, replaceString);
                if (temp2 === arr[detailArr[2]]) {
                    arr[detailArr[2]] = replace(arr[detailArr[2]], `'${chinese}'`, replaceString);
                    if (temp2 === arr[detailArr[2]]) {
                        arr[detailArr[2]] = replace(arr[detailArr[2]], chinese, replaceString);
                        if (temp2 === arr[detailArr[2]]) {
                            if (arr[detailArr[2]].indexOf(detailArr[0]) !== -1 ||
                                arr[detailArr[2] - 1].indexOf(detailArr[0]) !== -1) {
                                console.log('失败，请手动替换', text);
                            }
                        }
                    }
                }
            }
        }
    }

    const result = arr.join('\n');
    if (needImport.indexOf(detailArr[1]) === -1) {
        needImport.push(detailArr[1]);
    }

    fs.writeFileSync(detailArr[1], result, 'utf8');
}


// 修改所有的jsx内容
const jsxData = fs.readFileSync('i18n-messages/jsx.txt', 'utf8');
const jsxArr = jsxData.split('\n');
jsxArr.forEach(text => {
    generateAndWrite(text, '{', '}');
});

// 修改所有的text内容
const textData = fs.readFileSync('i18n-messages/text.txt', 'utf8');
const textArr = textData.split('\n');
textArr.forEach(text => {
    generateAndWrite(text, '', '');
});

// 这里加上文件头的import
needImport.forEach(src => {
    fs.readFile(src, 'utf8', (err, data) => {
        if (err) {
            return console.log(err);
        }

        const result = `import intl from 'base/reactIntlUniversal';\n${data}`;
        fs.writeFile(src, result, 'utf8', e => {
            if (e) return console.log(e);
            return 1;
        });
        return 1;
    });
});
