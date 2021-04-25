import { kurlyToWhooing, splitItems, parenToSquare } from '../kurly';

const KURLY_ITEM = `당도선별 고당도 수박 6kg
20,900원 1개 구매
배송완료	
후기쓰기
장바구니 담기
`;

const KURLY_ITEMS = `
당도선별 고당도 수박 6kg
20,900원 1개 구매
배송완료	
후기쓰기
장바구니 담기
	
[KF365] 애호박 1개
990원 1개 구매
배송완료	
후기쓰기
장바구니 담기
`;

const ITEM_WITH_GARBAGE = `[크레이브푸드] 콥 샐러드 240g
할인가5,865 원 판매가 6,900 원 1개 구매
배송완료	
후기쓰기
장바구니 담기
[오팡두] 데니쉬 식빵 2종

[오팡두] 데니쉬 식빵 플레인
할인가5,865 원 판매가 6,900 원 1개 구매
배송완료	
후기쓰기
장바구니 담기
`;

test('kurly->whooing', () => {
    expect(kurlyToWhooing(KURLY_ITEM, '오늘'))
        .toEqual('오늘 식재료(당도선별 고당도 수박 6kg) 20900 -식비 -네이버페이포인트');
});

test('grouping', () => {
    expect(splitItems(KURLY_ITEMS)).toHaveLength(2);
});

test('간헐적 6줄 등장해도 처리할 수 있어야 함', () => {
    expect(kurlyToWhooing(ITEM_WITH_GARBAGE, '오늘'))
        .toEqual('오늘 식재료([크레이브푸드] 콥 샐러드 240g) 5865 -식비 -네이버페이포인트');
});
test('not allowed parenthesis', () => {
    expect(parenToSquare('무항생제 1등급 암퇘지 삼겹 찌개용 200g(냉장)'))
        .toEqual('무항생제 1등급 암퇘지 삼겹 찌개용 200g[냉장]');
});
test('빈줄 처리', () => {
    expect(kurlyToWhooing('', '오늘'))
        .toEqual('');
});
