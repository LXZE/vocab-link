import * as utils from '@/lib/utils';

describe('test Graph DB', () => {
  test('sanitizer should work', () => {
    let dangerousString = '<img src="aaa" onError="alert(\'danger\')">';
    expect(utils.sanitize(dangerousString)).toEqual('img srcaaa onErroralert\'danger\'');

    dangerousString = '{(danger)}';
    expect(utils.sanitize(dangerousString)).toEqual('danger');
  });
});
