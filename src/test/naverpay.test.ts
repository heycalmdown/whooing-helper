import { split, sanitize, sliceItems, convert } from '../naverpay';

const DIRTY_ITEM = `
2020.09.06
이벤트 적립
충전포인트 결제(네이버통장)
+369원
내역삭제
사용
2020.09.05
결제 시 사용
배달의민족
-18,400원
내역삭제
적립
`;

const SANITIZED_ITEM = `
사용
2020.09.05
결제 시 사용
배달의민족
-18,400원
내역삭제
적립
`;

test('find-start-line', () => {
    expect(split('적립')).toEqual(sanitize(split('2020.09\n적립')));
});

test('handle-broken-items', () => {
    expect(split(SANITIZED_ITEM)).toEqual(sanitize(split(DIRTY_ITEM)));
});

test('slice-items', () => {
    expect(sliceItems(split(SANITIZED_ITEM))).toHaveLength(1);
});

test('convert-an-item', () => {
    expect(convert(split('사용\n2020.09.05\n결제 시 사용\n배달의안민족\n-18,400원\n내역삭제')))
        .toEqual('2020-09-05 18400 기타+ 네이버페이포인트- ? ;사용 2020-09-05 -18400 결제 시 사용 배달의안민족');
});

test('배달의민족은 식비로 처리해야 한다', () => {
    expect(convert(split('사용\n2020.09.05\n결제 시 사용\n배달의민족\n-18,400원\n내역삭제')))
        .toEqual('2020-09-05 18400 식비+ 네이버페이포인트- ? ;사용 2020-09-05 -18400 결제 시 사용 배달의민족');
});
