import * as fs from 'fs';

import { convertAll as naverpayConvertAll } from './naverpay';
import { convertAll as coupangConvertAll } from './coupang';
import { convertAll as kurlyConvertAll } from './kurly';

const argv = process.argv.slice(2);
if (argv.length === 0) {
    helpThenExit();
}
const type = process.argv[2];
if (type === 'naverpay') {
    naverpayConvertAll(fs.readFileSync(process.stdin.fd, 'utf-8'));
} else if (type === 'coupang') {
    coupangConvertAll(fs.readFileSync(process.stdin.fd, 'utf-8'));
} else if (type === 'kurly') {
    kurlyConvertAll(fs.readFileSync(process.stdin.fd, 'utf-8'), process.argv[3]);
}

function helpThenExit() {
    console.log(`
이렇게 하시오
$ pbpaste | node dist/index.js [coupang|naverpay|kurly]
`);
    process.exit();
}
