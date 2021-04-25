import { convert, split, sliceItems, parseType, typeToWhooing, reformat } from '../coupang';

const ITEMS = `
-66,000원인출
0원 (잔액)
2020.09.19 (토) 16:05
KEB하나은행 **********4507
-34,000원결제
66,000원 (잔액)
2020.09.19 (토) 16:01
[결제] 내추럴발란스 드라이 캣 포뮬라 LID 완두&닭고기, 완두, 2.04kg, 10000081311576
100,000원충전
100,000원 (잔액)
2020.09.19 (토) 16:01
[잔액충전] 내추럴발란스 드라이 캣 포뮬라 LID 완두&닭고기, 완두, 2.04kg, 10000081311576
-90,810원인출
0원 (잔액)
2020.09.18 (금) 21:44
KEB하나은행 **********4507
-109,190원결제
90,810원 (잔액)
2020.09.18 (금) 21:43
[결제] 켈로그 크랜베리 아몬드 그래놀라, 550g, 1개 포함 총 3건, 10000081262247
200,000원충전
200,000원 (잔액)
2020.09.18 (금) 21:43
[잔액충전] 켈로그 크랜베리 아몬드 그래놀라, 550g, 1개 포함 총 3건, 10000081262247
-90,601원인출
0원 (잔액)
2020.09.15 (화) 22:12
KEB하나은행 **********4507
-27,087원결제
90,601원 (잔액)
2020.09.15 (화) 22:11
[결제] 곰곰 하남식쭈꾸미 보통매운맛 (냉동), 450g, 1개 포함 총 4건, 10000081017617
100,000원충전
117,688원 (잔액)
2020.09.15 (화) 22:11
[잔액충전] 곰곰 하남식쭈꾸미 보통매운맛 (냉동), 450g, 1개 포함 총 4건, 10000081017617
`;


test('네 줄씩 쪼개야 한다', () => {
    expect(sliceItems(split(ITEMS))).toHaveLength(9);
});
test('인출 타입을 얻을 수 있어야 한다', () => {
    expect(parseType(sliceItems(split(ITEMS))[0][0])).toEqual('인출');
});
test('결제 타입을 얻을 수 있어야 한다', () => {
    expect(parseType(sliceItems(split(ITEMS))[1][0])).toEqual('결제');

});
test('충전 타입을 얻을 수 있어야 한다', () => {
    expect(parseType(sliceItems(split(ITEMS))[2][0])).toEqual('충전');
});
test('충전은 소하나에서 빠지고 소쿠페이머니로 들어와야 한다', () => {
    const SLICED = sliceItems(split(ITEMS));
    expect(typeToWhooing(reformat(SLICED[2])[0]))
        .toEqual('소쿠페이머니+ 소하나- 쿠페이 충전');
});
test('인출은 소쿠페이머니에서 빠지고 소하나로 들어와야 한다', () => {
    const SLICED = sliceItems(split(ITEMS));
    expect(typeToWhooing(reformat(SLICED[0])[0]))
        .toEqual('소하나+ 소쿠페이머니- 쿠페이 인출');
});
test('결제는 소쿠페이머니에서 빠지고 기타로 들어와야 한다', () => {
    const SLICED = sliceItems(split(ITEMS));
    expect(typeToWhooing(reformat(SLICED[1])[0]))
        .toEqual('기타+ 소쿠페이머니- ?');
});
test('원본 그대로 주석이 되어야 한다', () => {
    const SLICED = sliceItems(split(ITEMS));
    expect(reformat(SLICED[0])[5])
        .toEqual('-66,000원인출 0원 (잔액) 2020.09.19 (토) 16:05 KEB하나은행 **********4507');
});
test('최종 모습', () => {
    const SLICED = sliceItems(split(ITEMS));
    expect(convert(SLICED[0]))
        .toEqual('2020-09-19 66000 소하나+ 소쿠페이머니- 쿠페이 인출 ;-66,000원인출 0원 (잔액) 2020.09.19 (토) 16:05 KEB하나은행 **********4507');
});
