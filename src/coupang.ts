import { price, date, stringAbs } from './util';


export function sliceItems(lines: string[]): string[][] {
    if (lines.length < 4) return [];
    return [lines.slice(0, 4), ...sliceItems(lines.slice(4))];
}
  
  
export function split(a: string): string[] {
    return a.split('\n').filter(Boolean);
}

export function parseType(line: string): string {
    if (line.includes('인출')) return '인출';
    if (line.includes('충전')) return '충전';
    if (line.includes('결제')) return '결제';
    if (line.includes('취소')) throw new Error('취소건 해결 필요');
    console.log(line)
    throw new Error('알 수 없는 타입');
}

export function typeToWhooing(t: string): string {
    switch (t) {
        case '결제': return '기타+ 소쿠페이머니- ?';
        case '충전': return '소쿠페이머니+ 소토뱅- 쿠페이 충전';
        case '인출': return '소하나+ 소쿠페이머니- 쿠페이 인출';
    }
    throw new Error('알 수 없는 타입');
}

export function reformat(cols: string[]): string[] {
    // console.log(cols)
    const t = parseType(cols[0]);
    const p = price(cols[0]);
    const remains = cols[1];
    const d = date(cols[2].split(' ')[0]);
    const subject = cols[3];
    const cmt = cols.join(' ');
    return [t, p, remains, d, subject, cmt];
}

export function reorder(cols: string[]): string[] {
    const date = cols[3];
    return [date, stringAbs(cols[1]), typeToWhooing(cols[0]), `;${cols[5]}`];
}

export function convert(item: string[]): string {
    return reorder(reformat(item)).join(' ');
}

export function convertAll(source: string) {
    sliceItems(split(source)).reverse().forEach(o => {
        console.log(convert(o));
    })
}
