// The self-hosted gateway owns official competition data and intercepts this route.
// Browser practice deployments do not silently create an unprotected second control plane.
export async function GET() {
  return Response.json({ error: 'Giải đấu chính thức chạy trên bản Docker có bộ chấm riêng. Mở địa chỉ do ban tổ chức cung cấp.' }, { status: 503 });
}
export const POST = GET;
