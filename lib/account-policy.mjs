export const normalizeEmail = value => String(value || '').trim().toLowerCase();
export const isValidEmail = value => {
  const email = normalizeEmail(value);
  const match = /^([a-z0-9.!#$%&'*+/=?^_`{|}~-]+)@([a-z0-9.-]+\.[a-z]{2,})$/i.exec(email);
  return email.length <= 254 && !!match && !match[1].startsWith('.') && !match[1].endsWith('.')
    && !match[1].includes('..') && match[2].split('.').every(label => label.length > 0 && label.length <= 63 && !label.startsWith('-') && !label.endsWith('-'));
};
export const accountAllowed = user => !!user && !user.disabled && isValidEmail(user.email);
export function requireValidEmail(value) {
  const email = normalizeEmail(value);
  if (!isValidEmail(email)) throw Object.assign(new Error('Nhập địa chỉ email hợp lệ.'), { status: 400 });
  return email;
}
