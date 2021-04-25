
export function price(str: string): string {
    return parseInt(str.replace(/[^\d.-]/g, '').replace(/,/g, ''), 10).toString();
}

export function date(str: string): string {
    return str.replace(/\./g, '-');
}


export function stringAbs(price: string): string {
    return Math.abs(parseInt(price, 10)).toString();
}
