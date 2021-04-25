import { price } from './util';

export function parenToSquare(s: string): string {
    return s.replace(/\)/g, ']').replace(/\(/g, '[');
}

export function priceOnly(line: string): string {
    return price(line.split(' ')[0]);
}

export function kurlyToWhooing(item: string, date: string): string {
    const lines = item.split('\n');
    if (lines.length < 2) return '';
    const subj = parenToSquare(lines[0]);
    const price = priceOnly(lines[1]);
    return `${date} 식재료(${subj}) ${price} -식비 -네이버페이포인트`;
}

export function splitItems(x: string) {
    return x.replace(/\t/g, '').split('\n\n');
}

export function convertAll(source: string, date?: string) {
    splitItems(source).reverse().forEach(i => console.log(kurlyToWhooing(i, date ?? '오늘')));
}
