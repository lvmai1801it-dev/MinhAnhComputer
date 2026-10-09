/**
 * Fetcher cho SWR.
 * SWR gọi hàm này để lấy data — trả về response body.
 */

import axios from './axios';

export async function fetcher(url) {
  const res = await axios.get(url);
  return res.data;
}