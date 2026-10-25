// Codes describe official sandbox outcomes, not a static guarantee of safety.
export function botDiagnostic(reason, message = '') {
  const text = String(message);
  const code = /SyntaxError|IndentationError|TabError/.test(text) ? 'E01'
    : reason === 'invalid_move' ? 'E03'
    : reason === 'timeout' ? 'E04'
    : /PermissionError|ModuleNotFoundError|not supported|not permitted|No such file|Read-only|socket|subprocess/i.test(text) ? 'E05'
    : reason === 'output_limit' || /MemoryError|fuel|memory|tài nguyên/i.test(text) ? 'E06' : 'E02';
  const help = {
    E01: 'Kiểm tra cú pháp và thụt lề Python.', E02: 'Định nghĩa choose_move(state), kiểm tra lỗi khởi tạo; không in dữ liệu ra stdout.',
    E03: 'Trả về from/to thuộc state["legal_moves"].', E04: 'Giảm thời gian khởi tạo/tính nước đi theo config của giải.',
    E05: 'Sandbox không cấp mạng, filesystem host hoặc tiến trình con; dùng thư viện chuẩn được hỗ trợ.',
    E06: 'Giảm bộ nhớ, số phép tính và lượng output; kiểm tra quota của giải.',
  }[code];
  return { code, help, message: text.slice(0, 800) };
}
