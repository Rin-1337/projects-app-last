/**
 * lib/auth.tsx — ระบบเข้าสู่ระบบ (จำลองด้วย localStorage)
 * เจ้าของ: ทิวากร (Customer)
 *
 * TODO:
 * - AuthProvider + useAuth() คืน { user, login, logout, register }
 * - login(email, password) → ตรวจกับ users (ผ่าน services/users.ts) → เขียน session
 * - หลัง login พาไปหน้าตาม role: /customer, /organizer, /vendor, /admin
 * - บัญชีที่ status = "suspended" ห้ามเข้าสู่ระบบ
 * - ใส่ AuthProvider ใน app/layout.tsx และใช้ useAuth ใน components/shared/RoleShell.tsx
 */
export {};
