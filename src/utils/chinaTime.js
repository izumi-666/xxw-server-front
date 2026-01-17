/**
 * 获取当前北京时间
 * @returns {Date} 北京时间Date对象
 */
export const getBeijingTime = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  // 北京时区 UTC+8
  return new Date(utc + 3600000 * 8);
};