import { date, price, stringAbs } from './util';

export function split(a: string) {
    return a.split('\n').filter(Boolean);
}
function oneOf(a: string): boolean {
    return ['사용', '적립', '충전', '취소'].includes(a);
}
  
export function sanitize(a: string[]): string[] {
    if (!oneOf(a[0])) {
        a.shift();
        return sanitize(a);
    }
    return a;
}

export function sliceItems(a: string[]): string[][] {
    if (a.length < 6) return [];
    const sanitized = sanitize(a);
    return [sanitized.slice(0, 6), ...sliceItems(sanitized.slice(6))];
}

function merchantToWhooing(merchant: string): string {
    if (merchant.includes('nanaharu')) return '콩빈두+ 네이버페이포인트- ?';
    if (merchant.includes('PETHROOM')) return '콩빈두+ 네이버페이포인트- 콩빈두 모래';
    switch (merchant) {
        case '배달의민족': return '식비+ 네이버페이포인트- ?';
        case '네이버플러스 멤버십': return '기타비용+ 네이버페이포인트- 네이버플러스';
        case '프로젝트21': return '콩빈두+ 네이버페이포인트- 콩빈두 건강';
        case '3651': return '콩빈두+ 네이버페이포인트- 콩빈두 습식';
        case 'PETHROOM': return '콩빈두+ 네이버페이포인트- 콩빈두 모래';
        case '펫프렌즈': return '콩빈두+ 네이버페이포인트- 콩빈두 용품';
        case '베츠': return '콩빈두+ 네이버페이포인트- 콩빈두 건강(영양제)';
        case 'THESUJATA': return '미용+ 네이버페이포인트- 염색약';
        case '수자타헤나': return '미용+ 네이버페이포인트- 염색약';
    }
    return '기타+ 네이버페이포인트- ?';
}

function escapeByCancel(): string {
    console.error('취소건 발생');
    process.exit(1);
}

function typeToWhooing(type: string, merchant: string): string {
    switch (type) {
        case '사용':
            return merchantToWhooing(merchant);
        case '충전': return '네이버통장- 네이버페이포인트+ 네이버페이포인트 충전';
        case '적립': return '네이버페이포인트+ 페이백포인트기타+ 네이버페이포인트 적립';
        case '취소': return '취소';
        // case '취소': return escapeByCancel();
    }
    return '';
}

export function reorder(cols: string[]): string[] {
    const t = cols[0];
    const date = cols[1];
    const price = cols[2];
    const merchant = cols[4];
    return [date, stringAbs(price), typeToWhooing(t, merchant), `;${cols.join(' ')}`];
}

export function reformat(cols: string[]): string[] {
    const t = cols[0];
    const d = date(cols[1]);
    const cmt = cols[2];
    const merchant = cols[3];
    const p = price(cols[4]);
    return [t, d, p, cmt, merchant];
}

export function convert(a: string[]): string {
    return reorder(reformat(a)).join(' ');
}

export function convertAll(source: string) {
    sliceItems(split(source)).reverse().forEach(o => {
        console.log(convert(o));
    })
}
