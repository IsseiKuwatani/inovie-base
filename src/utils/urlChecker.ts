/**
 * 有効なHTTP/HTTPS URLかどうかをチェックする関数
 * @param url チェック対象のURL文字列
 * @returns 有効なURLの場合はtrue、そうでない場合はfalse
 */
export const isValidHttpUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (err) {
      return false;
    }
  };